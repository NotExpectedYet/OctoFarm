import { Test, TestingModule } from "@nestjs/testing";
import { TestProviders } from "../../../test/base/test.provider";
import { getRepositoryToken } from "@nestjs/typeorm";
import { HistoryCache } from "./history.cache";
import { PrinterHistory } from "../entities/printer-history.entity";
import { HistoryService } from "./history.service";
import { ServerSettingsCacheService } from "../../settings/services/server-settings-cache.service";
import { ServerSettingsService } from "../../settings/services/server-settings.service";
import { ServerSettings } from "../../settings/entities/server-settings.entity";
import { PrinterHistoryEntityMock } from "../entities/mocks/printer-history-entity.mock";
import { noCostSettingsMessage } from "../utils/print-cost.util";

describe(HistoryCache.name, () => {
  const illegalHistoryCache = [{ printHistory2: null }];
  const emptyLegalHistoryCache = [{ printHistory: {} }];
  const realisticHistoryCache = require("./mock-data/Histories.json");
  const interestingButWeirdHistoryCache = [
    {
      printHistory: {
        historyIndex: 0, // No historyIndex means big problem, but deferred... ouch
        state: "pfff im ok", // No state means errpr
        totalLength: 1,
        filamentSelection: {
          spools: {
            profile: {
              diameter: 5,
              density: 3
            }
          }
        },
        job: {
          filament: "pla"
        },
        spools: {
          pla: {
            type: "pla"
          }
        }
      }
    }
  ];

  let service: HistoryCache;
  let repoMock: PrinterHistoryEntityMock;
  let serverSettingsService: ServerSettingsService;

  const defaultFilamentManagerSettings = true;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryCache,
        HistoryService,
        ServerSettingsCacheService,
        ServerSettingsService,
        ...TestProviders,
        {
          provide: getRepositoryToken(PrinterHistory),
          useClass: PrinterHistoryEntityMock
        },
        {
          provide: getRepositoryToken(ServerSettings),
          useValue: {
            findOne: () => {
              return { filamentManager: defaultFilamentManagerSettings };
            },
            save: () => Promise.resolve()
          }
        }
      ]
    }).compile();

    service = module.get<HistoryCache>(HistoryCache);
    repoMock = module.get<PrinterHistoryEntityMock>(
      getRepositoryToken(PrinterHistory)
    );
    serverSettingsService = module.get<ServerSettingsService>(
      ServerSettingsService
    );
  });

  it("should initiate and finish within 5 sec for empty history", async () => {
    expect(service).toBeDefined();
    await service.initCache();
    await service.generateStatistics();

    // Check empty defaults
    expect(service.history).toBeTruthy();
    expect(service.history).toHaveLength(0);
    expect(service.statistics).toBeTruthy();
  });

  it("should initiate for a weird history entry", async () => {
    expect(service).toBeDefined();
    repoMock.setHistory(interestingButWeirdHistoryCache);

    const result = await serverSettingsService.findFirstOrAdd();
    expect(result.filamentManager).toBe(defaultFilamentManagerSettings);

    await service.initCache();
    await service.generateStatistics();

    // Check empty defaults
    expect(service.history).toBeTruthy();
    expect(service.history).toHaveLength(1);
    expect(service.statistics).toBeTruthy();
  });

  it("should initiate and finish within 5 sec for realistic history", async function () {
    // Mock only function
    repoMock.setHistory(realisticHistoryCache);

    expect(await repoMock.find()).toStrictEqual(realisticHistoryCache);

    await service.initCache();
    const historyClean = service.history;
    expect(historyClean.length).toEqual(realisticHistoryCache.length);

    historyClean.forEach((h) => {
      expect(h.printer).toContain("PRINTER");
      expect(h.notes).not.toBeUndefined();
      // TODO ... jeez
      // expect(Date.parse(h.startDate)).not.toBeNaN();
      // expect(Date.parse(h.endDate)).not.toBeNaN();
      expect(h.startDate).toContain("202");
      expect(h.endDate).toContain("202");
      expect(h.printerCost).not.toBeUndefined();
      expect(h.printerCost).not.toBeNaN();
      expect(h.printerCost).toEqual(parseFloat(h.printerCost).toFixed(2));
    });
    const stats = service.generateStatistics();
    expect(stats).toBeTruthy();

    expect(stats).toMatchObject({
      completed: 10,
      cancelled: 4,
      failed: 0,
      completedPercent: "71.43",
      cancelledPercent: "28.57",
      failedPercent: "0.00",
      longestPrintTime: "20900.00",
      shortestPrintTime: "64.00",
      averagePrintTime: "11014.10",
      mostPrintedFile: "file.gcode",
      printerMost: "PRINTER2",
      printerLoad: "PRINTER1",
      totalFilamentUsage: "286.66g / 95.56m",
      averageFilamentUsage: "28.67g / 9.56m",
      highestFilamentUsage: "68.50g / 22.42m",
      lowestFilamentUsage: "0.00g / 0.00m",
      totalSpoolCost: "1.99",
      highestSpoolCost: "1.85",
      totalPrinterCost: "7.62",
      highestPrinterCost: "1.89",
      currentFailed: 247,
      historyByDay: [
        {
          data: [
            {
              x: expect.any(Date),
              y: 1
            }
          ],
          name: "Success"
        },
        {
          data: [],
          name: "Failed"
        },
        {
          data: [
            {
              x: expect.any(Date),
              y: 1
            }
          ],
          name: "Cancelled"
        }
      ],
      totalByDay: [
        {
          data: [],
          name: "PETG"
        },
        {
          data: [
            {
              x: expect.any(Date),
              y: 2.21
            }
          ],
          name: "PLA"
        }
      ],
      usageOverTime: [
        {
          data: [],
          name: "PETG"
        },
        {
          data: [
            {
              x: expect.any(Date),
              y: 2.21
            }
          ],
          name: "PLA"
        }
      ]
    });

    expect(stats.historyByDay).toHaveLength(3);
    expect(stats.historyByDay[0].data.length).toBeGreaterThan(0); // Success
    expect(stats.historyByDay[1].data.length).toBe(0); // Cancelled
    expect(stats.historyByDay[2].data.length).toBe(1); // Failed
    expect(stats.usageOverTime[0].data.length).toBe(0);
    expect(stats.usageOverTime[1].data.length).toBe(1);
    expect(stats.totalByDay[0].data.length).toBe(0); // PETG usage === 0
    expect(stats.totalByDay[1].data.length).toBeGreaterThan(0);
    expect(stats.totalSpoolCost).not.toBe("NaN");
    expect(stats.highestSpoolCost).not.toBe("NaN");
  });

  /**
   * @James look at this. We could skip those entries, or remove them immediately.
   * I do think unhandled rejection is not an option though (I removed try-catch on purpose to reveal errors)
   * We should consider try-catching on top level, not directly on method,
   *  as problem like this then never gets discovered.
   */
  it("should reject when history entities contain illegal entry key", async () => {
    repoMock.setHistory(illegalHistoryCache);
    await expect(service.initCache()).rejects.toBeTruthy();
  });

  it("should be able to generate statistics without error", async function () {
    repoMock.setHistory(emptyLegalHistoryCache);

    const result = await repoMock.find();
    expect(result).toHaveLength(1);
    await service.initCache();

    // Another test phase
    repoMock.setHistory(interestingButWeirdHistoryCache);
    await service.initCache();

    expect(service.history[0].printerCost).toEqual(noCostSettingsMessage);
    // Expect the rabbit hole to be deep.
    expect(service.history[0].index).toEqual(
      interestingButWeirdHistoryCache[0].printHistory.historyIndex
    );
    // Act
    const historyStats = service.generateStatistics();
    // Assert
    expect(historyStats).toBeTruthy();
    expect(historyStats.failed).toEqual(1);
  });

  // TODO conform new type for filament (key-value array)
  // TODO historyClean[0]:job:printTimeAccuracy === NaN
  it("should turn a single tool into array", async () => {
    repoMock.setHistory(realisticHistoryCache);

    await service.initCache();

    expect(service.history).toHaveLength(14);
    // A case where a tool is not set
    expect(service.history[3].spools).toBeNull();
    expect(service.history[13].spools[0].tool0.toolName).toBe("Tool 0");
  });

  it("should not return NaN in printHours", async () => {
    repoMock.setHistory(interestingButWeirdHistoryCache);

    await service.initCache();

    expect(service.history[0].printHours).not.toContain("NaN");
    expect(service.history[0].printHours).toEqual("?");
  });

  it("should allow process spools to return associative array when spools is non-empty", async () => {
    repoMock.setHistory(interestingButWeirdHistoryCache);

    await expect(await service.initCache()).resolves;

    const resultingSpoolsReport = HistoryCache.processHistorySpools(
      service.history[0],
      [],
      [],
      []
    );
    expect(resultingSpoolsReport.historyByDay).toContainEqual({
      name: "Success",
      data: []
    });
  });
});

/**
 * Most of these functions below are easily tested in isolation
 */
describe("historyClean:Static", () => {
  it("assignYCumSum tolerate falsy y values and skips falsy entries", () => {
    const undefinedYInput = [
      { x: 0, y: undefined },
      { x: 0, y: 1 },
      { x: 0, y: undefined },
      { x: 0 },
      { x: 0, y: 1 }
    ];
    const missingYInput = [
      { x: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 1 },
      { x: 0 },
      { x: 0, y: 1 }
    ];
    const falsyContainingInput = [
      null,
      { x: 0, y: 1 },
      { x: 0 },
      undefined,
      { x: 0, y: 1 }
    ];

    // Prove that the new function outputs something useful
    expect(HistoryCache.assignYCumSum(undefinedYInput)[4]).toStrictEqual({
      x: 0,
      y: 2
    });
    expect(HistoryCache.assignYCumSum(missingYInput)[4]).toStrictEqual({
      x: 0,
      y: 3
    });

    // Prove that the new function outputs for only defined x properties, but tolerates falsy y
    const gappyCumSum = HistoryCache.assignYCumSum(falsyContainingInput);
    expect(gappyCumSum.length).toEqual(3);
    expect(gappyCumSum[2]).toStrictEqual({ x: 0, y: 2 });
  });

  function legacyConvertIncremental(input) {
    let usageWeightCalc = 0;
    let newObj = [];
    for (let i = 0; i < input.length; i++) {
      if (typeof newObj[i - 1] !== "undefined") {
        usageWeightCalc = newObj[i - 1].y + input[i].y;
      } else {
        usageWeightCalc = input[i].y;
      }
      newObj.push({ x: input[i].x, y: usageWeightCalc });
    }
    return newObj;
  }

  it("assignYCumSum is equivalent to map-cumulativeSum operator", () => {
    const input = [
      { x: 0, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 1 }
    ];
    const unitUnderTestResult = legacyConvertIncremental(input);
    expect(unitUnderTestResult).toHaveLength(5);
    expect(unitUnderTestResult[4]).toStrictEqual({ x: 0, y: 5 });

    const operatorComparedResult = HistoryCache.assignYCumSum(input);
    expect(operatorComparedResult).toStrictEqual(unitUnderTestResult);
  });

  it("should be able to call static processHistorySpools", () => {
    const result = HistoryCache.processHistorySpools(
      {
        spools: [
          {
            pla: {
              type: "abs"
            }
          }
        ]
      },
      [],
      [],
      []
    );

    expect(result.totalByDay[0].name).toEqual("abs");
  });
});

/**
 * Most of these functions below are easily tested in isolation and apart from history Clean
 *  They are mostly used in history clean context however
 */
describe("historyClean:Utilities", () => {
  it("deeply nested property material should never resolve to falsy property", () => {
    const testedValues = ["", null, undefined, {}, [], 0, -1];
    for (let value of testedValues) {
      // @ts-ignore
      expect(value?.spools?.profile?.material || "").toBe("");
    }
  });
});
