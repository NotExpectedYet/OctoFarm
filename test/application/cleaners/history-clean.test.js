jest.mock("../../../server_src/services/history.service");
const mockHistoryService = require("../../../server_src/services/history.service");
const {
  noCostSettingsMessage
} = require("../../../server_src/lib/utils/print-cost.util");
const { isPromise } = require("jest-util");

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

const nullJobHistoryCache = [
  {
    printHistory: {
      job: null
    }
  },
  {
    printHistory: {
      success: true,
      job: null
    }
  }
];

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

beforeEach(() => {
  mockHistoryService.resetMockData();
});

beforeEach(() => {
  // Temporarily allow us to alter timezone calculation for testing
  /*eslint no-extend-native: "off"*/
  Date.prototype.getTimezoneOffset = jest.fn(() => 0);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("historyClean", function () {
  Date.now = () => 1618059562000;
  process.env.TZ = "UTC";

  let HistoryClean =
    require("../../../server_src/lib/dataFunctions/historyClean").HistoryClean;
  it("should initiate and finish within 5 sec for empty history", async function () {
    expect(await mockHistoryService.find({})).toHaveLength(0);

    const historyState = new HistoryClean(false, "info");
    expect(historyState.logger).toBeDefined();
    const voidResponse = await historyState.initCache();
    expect(voidResponse).toBeFalsy();
    expect(historyState.statisticsClean).toBeTruthy();
    expect(historyState.historyClean).toBeTruthy();
    expect(historyState.historyClean).toHaveLength(0);
    expect(true).toEqual(true);
  });

  it("should initiate and finish within 5 sec for non-empty history", async function () {
    // Mock only function
    mockHistoryService.saveMockData(emptyLegalHistoryCache);

    expect(await mockHistoryService.find({})).toStrictEqual(
      emptyLegalHistoryCache
    );

    const historyState = new HistoryClean(false, "info");
    const stats = historyState.generateStatistics();
    expect(stats).toBeTruthy();
  });

  it("should initiate and finish within 5 sec for realistic history", async function () {
    // Mock only function
    mockHistoryService.saveMockData(realisticHistoryCache);

    expect(await mockHistoryService.find({})).toStrictEqual(
      realisticHistoryCache
    );

    const historyState = new HistoryClean(false, "info");
    await historyState.initCache();

    const historyClean = historyState.historyClean;
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
    const stats = historyState.generateStatistics();
    expect(stats).toBeTruthy();

    expect(stats).toEqual({
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
            },
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
              y: 2
            }
          ],
          name: "Cancelled"
        }
      ],
      totalByDay: [
        {
          data: [
            {
              x: expect.any(Date),
              y: 68.5
            }
          ],
          name: "PETG"
        },
        {
          data: [
            {
              x: expect.any(Date),
              y: 2.3499999999999996
            }
          ],
          name: "PLA"
        }
      ],
      usageOverTime: [
        {
          data: [
            {
              x: expect.any(Date),
              y: 68.5
            }
          ],
          name: "PETG"
        },
        {
          data: [
            {
              x: expect.any(Date),
              y: 2.3499999999999996
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
    expect(stats.usageOverTime[0].data.length).toBe(1);
    expect(stats.usageOverTime[1].data.length).toBe(1);
    expect(stats.totalByDay[0].data.length).toBe(1); // PETG usage > 1
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
    mockHistoryService.saveMockData(illegalHistoryCache);
    const historyState = new HistoryClean(false, "info");
    await expect(historyState.initCache()).rejects.toBeTruthy();
  });

  it("should be able to generate statistics without error", async function () {
    mockHistoryService.saveMockData(emptyLegalHistoryCache);
    expect(await mockHistoryService.find({})).toHaveLength(1);
    const historyState = new HistoryClean(false, "info");
    await expect(historyState.initCache()).resolves.toBeFalsy();

    // Another test phase
    mockHistoryService.saveMockData(interestingButWeirdHistoryCache);
    const historyState2 = new HistoryClean(false, "info");
    // Expect void resolve
    await expect(historyState2.initCache()).resolves.toBeFalsy();
    expect(historyState2.historyClean[0].printerCost).toEqual(
      noCostSettingsMessage
    );
    // Expect the rabbit hole to be deep.
    expect(historyState2.historyClean[0].index).toEqual(
      interestingButWeirdHistoryCache[0].printHistory.historyIndex
    );
    // Act
    const historyStats = historyState.generateStatistics();
    // Assert
    expect(historyStats).toBeTruthy();
    expect(historyStats.failed).toEqual(1);
  });

  // TODO conform new type for filament (key-value array)
  // TODO historyClean[0]:job:printTimeAccuracy === NaN
  it("should turn a single tool into array", async () => {
    mockHistoryService.saveMockData(realisticHistoryCache);

    const historyState = new HistoryClean(false, "info");
    await historyState.initCache();

    expect(historyState.historyClean).toHaveLength(14);
    // A case where a tool is not set
    expect(historyState.historyClean[3].spools).toBeNull();
    expect(historyState.historyClean[13].spools[0].tool0.toolName).toBe(
      "Tool 0"
    );
  });

  it("should not return NaN in printHours", async () => {
    mockHistoryService.saveMockData(interestingButWeirdHistoryCache);

    const historyState = new HistoryClean(false, "info");
    await historyState.initCache();

    expect(historyState.historyClean[0].printHours).not.toContain("NaN");
    expect(historyState.historyClean[0].printHours).toEqual("?");
  });

  it("should allow process spools to return associative array when spools is non-empty", async () => {
    mockHistoryService.saveMockData(interestingButWeirdHistoryCache);

    const historyState = new HistoryClean(false, "info");
    await expect(await historyState.initCache()).resolves;

    const resultingSpoolsReport = HistoryClean.processHistorySpools(
      historyState.historyClean[0],
      [],
      [],
      []
    );
    expect(resultingSpoolsReport.historyByDay).toContainEqual({
      name: "Success",
      data: []
    });
  });

  it("should not throw when job property is null", async () => {
    mockHistoryService.saveMockData(nullJobHistoryCache);

    const historyState = new HistoryClean(false, "info");
    await expect(await historyState.initCache()).resolves;
    const stats = await historyState.generateStatistics();

    expect(stats).toBeTruthy();
    expect(stats.completed).toEqual(1);
    expect(stats.failed).toEqual(1);
  });
});

/**
 * Most of these functions below are easily tested in isolation
 */
describe("historyClean:Static", () => {
  let HistoryClean =
    require("../../../server_src/lib/dataFunctions/historyClean").HistoryClean;

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
    // Prove that the old function was buggy
    expect(legacyConvertIncremental(undefinedYInput)[4]).toStrictEqual({
      x: 0,
      y: NaN
    });
    expect(legacyConvertIncremental(missingYInput)[4]).toStrictEqual({
      x: 0,
      y: NaN
    });
    expect(() => legacyConvertIncremental(falsyContainingInput)[4]).toThrow();

    // Prove that the new function outputs something useful
    expect(HistoryClean.assignYCumSum(undefinedYInput)[4]).toStrictEqual({
      x: 0,
      y: 2
    });
    expect(HistoryClean.assignYCumSum(missingYInput)[4]).toStrictEqual({
      x: 0,
      y: 3
    });

    // Prove that the new function outputs for only defined x properties, but tolerates falsy y
    const gappyCumSum = HistoryClean.assignYCumSum(falsyContainingInput);
    expect(gappyCumSum.length).toEqual(3);
    expect(gappyCumSum[2]).toStrictEqual({ x: 0, y: 2 });
  });

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

    const operatorComparedResult = HistoryClean.assignYCumSum(input);
    expect(operatorComparedResult).toStrictEqual(unitUnderTestResult);
  });

  it("should not return Promise on static processHistorySpools", () => {
    const result = HistoryClean.processHistorySpools(
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

    expect(isPromise(result)).toEqual(false);
  });

  it("should calculate spool weight with calcSpoolWeightAsString equivalently to getWeight function", () => {
    function getWeight(length, spool, printPercentage, success) {
      if (typeof spool !== "undefined" && spool !== null) {
        if (typeof length !== "undefined") {
          if (length === 0) {
            return length;
          } else {
            const radius = parseFloat(spool.spools.profile.diameter) / 2;
            const volume = length * Math.PI * radius * radius;
            let usage = "";
            if (success) {
              usage = (
                volume * parseFloat(spool.spools.profile.density)
              ).toFixed(2);
            } else {
              usage = (
                (printPercentage / 100) *
                (volume * parseFloat(spool.spools.profile.density))
              ).toFixed(2);
            }
            return usage;
          }
        } else {
          return 0;
        }
      } else {
        if (typeof length !== "undefined") {
          length = length;
          if (length === 0) {
            return length;
          } else {
            const radius = 1.75 / 2;
            const volume = length * Math.PI * radius * radius;
            let usage = "";
            if (success) {
              usage = (volume * 1.24).toFixed(2);
            } else {
              usage = ((printPercentage / 100) * (volume * 1.24)).toFixed(2);
            }
            return usage;
          }
        } else {
          return 0;
        }
      }
    }

    const length1 = 18.648094819996633;
    expect(getWeight(length1, undefined, 100, 0)).toEqual(
      HistoryClean.calcSpoolWeightAsString(length1, undefined, 1)
    );
    expect(getWeight(length1, undefined, 50, 0)).toEqual(
      HistoryClean.calcSpoolWeightAsString(length1, undefined, 0.5)
    );
    expect(getWeight(length1, undefined, 50, 1)).toEqual(
      HistoryClean.calcSpoolWeightAsString(length1, undefined, 1)
    );
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
      expect(value?.spools?.profile?.material || "").toBe("");
    }
  });
});
