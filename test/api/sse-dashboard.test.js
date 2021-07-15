jest.mock("../../server_src/config/auth");

const EventSource = require("eventsource");
const { parse } = require("flatted/cjs");
const dbHandler = require("../db-handler");
const supertest = require("supertest");
const getEndpoints = require("express-list-endpoints");
const { PrinterClean } = require("../../server_src/state/data/printerClean");
const { setupTestApp } = require("../../app-test");

let request;
const routeBase = "/dashboardInfo/";
const ssePath = "get/";

beforeAll(async () => {
  await dbHandler.connect();
  const server = await setupTestApp();

  const endpoints = getEndpoints(server);
  expect(endpoints).toContainEqual({
    methods: ["GET"],
    middleware: ["anonymous", "anonymous"],
    path: routeBase + ssePath
  });
  request = supertest(server);
});

describe("SSE-dashboard", () => {
  it("should be able to be called with an EventSource", async () => {
    await PrinterClean.initFarmInformation();
    await PrinterClean.statisticsStart();
    const getRequest = request.get(routeBase + ssePath);
    const url = getRequest.url;
    expect(url).toBeTruthy();

    const es = new EventSource(url);

    await Promise.resolve((done) => {
      es.onmessage = (e) => {
        const parsedMsg = parse(e.data);

        expect(parsedMsg).toMatchObject({
          printerInformation: expect.any(Array), // TODO printerInformation instead of printersInformation?
          currentOperations: {
            operations: expect.any(Array), // TODO printerInformation instead of printersInformation?
            count: {
              printerCount: expect.any(Number),
              complete: expect.any(Number),
              offline: expect.any(Number),
              active: expect.any(Number),
              idle: expect.any(Number),
              disconnected: expect.any(Number),
              farmProgress: expect.any(Number),
              farmProgressColour: expect.any(String)
            }
          },
          dashStatistics: {
            currentUtilisation: expect.any(Array),
            currentStatus: expect.any(Array), // TODO 3x null?,
            timeEstimates: {
              totalElapsed: expect.any(Number),
              totalRemaining: expect.any(Number),
              totalEstimated: expect.any(Number),
              averageElapsed: null,
              averageRemaining: null,
              averageEstimated: null,
              cumulativePercent: null,
              cumulativePercentRemaining: null,
              averagePercent: null,
              averagePercentRemaining: null,
              totalFarmTemp: expect.any(Number)
            },
            farmUtilisation: {
              activeHours: 0,
              failedHours: 0,
              idleHours: 0,
              offlineHours: 0,
              activeHoursPercent: null,
              failedHoursPercent: null,
              idleHoursPercent: null,
              offlineHoursPercent: null
            },
            printerHeatMaps: {
              heatStatus: [],
              heatProgress: [],
              heatTemps: [],
              heatUtilisation: []
            },
            utilisationGraph: {},
            temperatureGraph: [
              {
                name: "Actual Tool",
                data: expect.arrayContaining([
                  {
                    x: expect.any(Number),
                    y: expect.any(Number)
                  }
                ])
              },
              {
                name: "Target Tool",
                data: expect.arrayContaining([
                  {
                    x: expect.any(Number),
                    y: expect.any(Number)
                  }
                ])
              },
              {
                name: "Actual Bed",
                data: expect.arrayContaining([
                  {
                    x: expect.any(Number),
                    y: expect.any(Number)
                  }
                ])
              },
              {
                name: "Target Bed",
                data: expect.arrayContaining([
                  {
                    x: expect.any(Number),
                    y: expect.any(Number)
                  }
                ])
              },
              {
                name: "Actual Chamber",
                data: expect.arrayContaining([
                  {
                    x: expect.any(Number),
                    y: expect.any(Number)
                  }
                ])
              },
              {
                name: "Target Chamber",
                data: expect.arrayContaining([
                  {
                    x: expect.any(Number),
                    y: expect.any(Number)
                  }
                ])
              }
            ],
            currentIAQ: null,
            currentTemperature: null,
            currentPressure: null,
            currentHumidity: null,
            enviromentalData: expect.any(Array)
          },
          dashboardSettings: {
            defaultLayout: [
              {
                x: 0,
                y: 0,
                width: 2,
                height: 5,
                id: "currentUtil"
              },
              {
                x: 5,
                y: 0,
                width: 3,
                height: 5,
                id: "farmUtil"
              },
              {
                x: 8,
                y: 0,
                width: 2,
                height: 5,
                id: "averageTimes"
              },
              {
                x: 10,
                y: 0,
                width: 2,
                height: 5,
                id: "cumulativeTimes"
              },
              {
                x: 2,
                y: 0,
                width: 3,
                height: 5,
                id: "currentStat"
              },
              {
                x: 6,
                y: 5,
                width: 3,
                height: 5,
                id: "printerTemps"
              },
              {
                x: 9,
                y: 5,
                width: 3,
                height: 5,
                id: "printerUtilisation"
              },
              {
                x: 0,
                y: 5,
                width: 3,
                height: 5,
                id: "printerStatus"
              },
              {
                x: 3,
                y: 5,
                width: 3,
                height: 5,
                id: "printerProgress"
              },
              {
                x: 6,
                y: 10,
                width: 6,
                height: 9,
                id: "hourlyTemper"
              },
              {
                x: 0,
                y: 10,
                width: 6,
                height: 9,
                id: "weeklyUtil"
              },
              {
                x: 0,
                y: 19,
                width: 12,
                height: 8,
                id: "enviroData"
              },
              {
                x: 0,
                y: 19,
                width: 12,
                height: 8,
                id: "filamentUsageOverTime"
              },
              {
                x: 0,
                y: 19,
                width: 12,
                height: 8,
                id: "filamentUsageByDay"
              },
              {
                x: 0,
                y: 19,
                width: 12,
                height: 8,
                id: "historyCompletionByDay"
              }
            ],
            savedLayout: [],
            farmActivity: {
              currentOperations: false,
              cumulativeTimes: true,
              averageTimes: true
            },
            printerStates: {
              printerState: true,
              printerTemps: true,
              printerUtilisation: true,
              printerProgress: true,
              currentStatus: true
            },
            farmUtilisation: {
              currentUtilisation: true,
              farmUtilisation: true
            },
            historical: {
              weeklyUtilisation: true,
              hourlyTotalTemperatures: true,
              environmentalHistory: false,
              filamentUsageOverTime: false,
              filamentUsageByDay: false,
              historyCompletionByDay: false
            }
          }
        });

        es.close();
        done();
      };
    });
  }, 10000);
});
