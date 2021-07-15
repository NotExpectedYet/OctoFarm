jest.mock("../../../server_src/services/farm-statistics.service");
jest.mock("../../../server_src/models/ErrorLog");
jest.mock("../../../server_src/models/TempHistory");
jest.mock("../../../server_src/models/RoomData");
const mockFarmStatisticsService = require("../../../server_src/services/farm-statistics.service");
const RoomData = require("../../../server_src/models/RoomData");
const {
  zeroFigureHeatmap,
  emptyHeatmap,
  nanFigureHeatmap
} = require("./test-data/heatmap-state");
const {
  PrinterClean
} = require("../../../server_src/lib/dataFunctions/printerClean");
const dayName = new Intl.DateTimeFormat(["en"], {
  weekday: "long" // ?? what should I put here
}).format(new Date());

beforeEach(() => {
  mockFarmStatisticsService.resetMockData();
});

describe("PrinterClean", function () {
  it("should save farmInfos to database when non-existent", async function () {
    const farmStatsBefore = await mockFarmStatisticsService.list();
    expect(farmStatsBefore).toHaveLength(0);

    const message = await PrinterClean.initFarmInformation();

    const farmStats = await mockFarmStatisticsService.list();

    expect(farmStats).toHaveLength(1);
    expect(farmStats[0].farmStart.getDate()).toEqual(new Date().getDate());
    expect(farmStats[0].heatMap).toHaveLength(5);
    expect(message).toEqual("Farm information inititialised...");
  });

  // TODO This test requires mocking saveModified or change that call in PrinterClean
  test.skip("should fix farmInfos with undefined heatmap", async function () {
    mockFarmStatisticsService.saveMockData([
      {
        farmStart: new Date(),
        heatMap: undefined
      }
    ]);
    const message = await PrinterClean.initFarmInformation();

    const farmStats = await mockFarmStatisticsService.list();

    expect(farmStats).toHaveLength(1);
    expect(message).toEqual("Farm information inititialised...");
  });

  it("should not throw for fresh data arrays in farmInfo:heatMap", async function () {
    mockFarmStatisticsService.saveMockData([
      {
        farmStart: new Date(),
        heatMap: [
          {
            name: "Completed",
            data: []
          }
        ]
      }
    ]);

    expect(PrinterClean.initFarmInformation()).resolves.toBeTruthy();
    // expect(PrinterClean.initFarmInformation()).rejects.toThrow("Cannot read property 'x' of undefined");
  });

  // TODO we'd like to have this test fail (as some statistics are missing)
  it("should tolerate missing statistics in farmInfo:heatMap", async function () {
    mockFarmStatisticsService.saveMockData([
      {
        farmStart: new Date(),
        heatMap: [
          {
            name: "Completed",
            data: [
              {
                x: "Wednesday",
                y: 0
              }
            ]
          }
        ]
      }
    ]);
    const message = await PrinterClean.initFarmInformation();

    const farmStats = await mockFarmStatisticsService.list();

    expect(farmStats).toHaveLength(1);
    expect(farmStats).toHaveLength(1);
    expect(farmStats[0].farmStart.getDate()).toEqual(new Date().getDate());
    expect(farmStats[0].heatMap).toHaveLength(1);
    expect(farmStats[0].heatMap[0].name).toEqual("Completed");
    expect(message).toEqual("Farm information inititialised...");
  });

  it("should run heatmapping problematically", async () => {
    let farmStats = await mockFarmStatisticsService.list({});
    expect(farmStats).toHaveLength(0);

    await PrinterClean.heatMapping();

    farmStats = await mockFarmStatisticsService.list({});
    expect(farmStats).toHaveLength(0);

    await PrinterClean.heatMapping();

    farmStats = await mockFarmStatisticsService.list({});
    expect(farmStats).toHaveLength(0);
  });

  it("should run heatmapping normally - farm is initiated in time", async () => {
    mockFarmStatisticsService.resetMockData();
    let farmStats1 = await mockFarmStatisticsService.list({});
    expect(farmStats1).toHaveLength(0);

    // TODO in no way can we reset the heatmap without a restart... previous tests cause it to be so
    let farmStatsReport = await PrinterClean.initFarmInformation();

    expect(farmStatsReport).toEqual("Farm information inititialised...");
    let farmStats = await mockFarmStatisticsService.list({});
    expect(farmStats).toHaveLength(1);
    // This is what I meant with TODO above
    // expect(farmStats[0].heatMap).toMatchObject(emptyHeatmap);

    await PrinterClean.heatMapping();

    farmStats = await mockFarmStatisticsService.list({});
    expect(farmStats).toHaveLength(1);
    // expect(farmStats[0].heatMap).toMatchObject(emptyHeatmap);

    // Call again for another branch in the code...
    await PrinterClean.heatMapping();

    // TODO NaN figure value, completely random daynames for me (D)
    // expect(farmStats[0].heatMap).toMatchObject(nanFigureHeatmap);

    farmStats = await mockFarmStatisticsService.list({});
    expect(farmStats).toHaveLength(1);
  });

  it("should run generateConnectionLogs just fine", async () => {
    await PrinterClean.generateConnectionLogs([]);
  });

  it("should be able to call returnFilamentList", () => {
    expect(PrinterClean.returnFilamentList()).toEqual([]);
  });

  it("should be able to call sumValuesGroupByDate", () => {
    expect(PrinterClean.sumValuesGroupByDate([])).toEqual([]);
    expect(PrinterClean.sumValuesGroupByDate([{ x: 1, y: 1 }])).toMatchObject([
      {
        x: expect.any(Date),
        y: 1
      }
    ]);
  });

  it("should be able to call returnPrinterLogs", () => {
    expect(PrinterClean.returnPrinterLogs()).toEqual([]);
    expect(PrinterClean.returnPrinterLogs(0)).toBeUndefined();
  });

  it("should run checkTempRange util with expected temperature state", async () => {
    let tempState = PrinterClean.checkTempRange(1, 2, 3, 4, 5);
    expect(tempState).toBe("tempOffline");

    tempState = PrinterClean.checkTempRange("Active", 2, 3, 4, 5);
    expect(tempState).toBe("tempSuccess");

    tempState = PrinterClean.checkTempRange("Idle", 2, 3, 4, 5);
    expect(tempState).toBe("tempSuccess");

    tempState = PrinterClean.checkTempRange("Complete", 2, 3, 4, 5);
    expect(tempState).toBe("tempCool");

    tempState = PrinterClean.checkTempRange("Complete", 2, 30, 4, 5);
    expect(tempState).toBe("tempCooling");
  });

  it("should run getProgressColour util with expected responses", async () => {
    expect(PrinterClean.getProgressColour(0)).toEqual("dark");
    expect(PrinterClean.getProgressColour(24)).toEqual("secondary");
    expect(PrinterClean.getProgressColour(25)).toEqual("primary");
    expect(PrinterClean.getProgressColour(50)).toEqual("primary");
    expect(PrinterClean.getProgressColour(51)).toEqual("info");
    expect(PrinterClean.getProgressColour(75)).toEqual("info");
    expect(PrinterClean.getProgressColour(76)).toEqual("warning");
    expect(PrinterClean.getProgressColour(100)).toEqual("success");
  });

  it("should return with empty octoprint versions array", async () => {
    // TODO does not throw any error because of input validation right now
    const returnedStats = await PrinterClean.returnAllOctoPrintVersions();
    expect(returnedStats).toEqual([]);
  });

  it("should call statisticsStart no problem", async () => {
    await RoomData.create([]);
    await PrinterClean.statisticsStart();
  });

  it("should call sortCurrentOperations no problem", async () => {
    await PrinterClean.sortCurrentOperations([{}]);
  });

  it("should call sortCurrentOperations with printerState truthy no problem", async () => {
    await PrinterClean.sortCurrentOperations([{ printerState: { colour: { category: "Idle" } } }]);
    await PrinterClean.sortCurrentOperations([
      { printerState: { colour: { category: "Offline" } } }
    ]);
    await PrinterClean.sortCurrentOperations([
      { printerState: { colour: { category: "Disconnected" } } }
    ]);
  });

  it("should call sortCurrentOperations with printerState completed no problem", async () => {
    await PrinterClean.sortCurrentOperations([
      {
        printerState: { colour: { category: "Complete" } },
        currentJob: {},
        _id: 1 // TODO toString error if not present
      }
    ]);
    await PrinterClean.sortCurrentOperations([
      {
        printerState: { colour: { category: "Active" } },
        currentJob: {},
        _id: 1 // TODO toString error if not present
      }
    ]);
  });

  it("should generate printer statistics without errors", async () => {
    // TODO does not throw any error because of input validation right now
    const returnedStats = await PrinterClean.generatePrinterStatistics();
    expect(returnedStats).toBeTruthy();
  });
});
