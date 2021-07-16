const ClientSettingsDB = require("../models/ClientSettings.js");
const settingsClean = require("../lib/dataFunctions/settingsClean.js");

const { SettingsClean } = settingsClean;

class ClientSettings {
  static init() {
    ClientSettingsDB.find({})
      .then((settings) => {
        if (settings.length < 1) {
          // const currentOperationsView = {};
          const dashboard = {
            defaultLayout: [
              { x: 0, y: 0, width: 2, height: 5, id: "currentUtil" },
              { x: 5, y: 0, width: 3, height: 5, id: "farmUtil" },
              { x: 8, y: 0, width: 2, height: 5, id: "averageTimes" },
              { x: 10, y: 0, width: 2, height: 5, id: "cumulativeTimes" },
              { x: 2, y: 0, width: 3, height: 5, id: "currentStat" },
              { x: 6, y: 5, width: 3, height: 5, id: "printerTemps" },
              { x: 9, y: 5, width: 3, height: 5, id: "printerUtilisation" },
              { x: 0, y: 5, width: 3, height: 5, id: "printerStatus" },
              { x: 3, y: 5, width: 3, height: 5, id: "printerProgress" },
              { x: 6, y: 10, width: 6, height: 9, id: "hourlyTemper" },
              { x: 0, y: 10, width: 6, height: 9, id: "weeklyUtil" },
              { x: 0, y: 19, width: 12, height: 8, id: "enviroData" },
              {
                x: 0,
                y: 19,
                width: 12,
                height: 8,
                id: "filamentUsageOverTime"
              },
              { x: 0, y: 19, width: 12, height: 8, id: "filamentUsageByDay" },
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
          };
          const panelView = {
            currentOp: false,
            hideOff: true,
            hideClosed: false,
            extraInfo: false,
            powerBtn: false,
            webBtn: false
          };
          const listView = {
            currentOp: false,
            hideOff: true,
            hideClosed: false,
            extraInfo: false,
            powerBtn: false,
            webBtn: false
          };
          const cameraView = {
            currentOp: false,
            cameraRows: 4,
            hideClosed: false,
            extraInfo: false,
            powerBtn: false,
            webBtn: false
          };
          const controlSettings = {
            filesTop: false
          };
          // const operations = {};
          // const filaManager = {};
          const defaultSystemSettings = new ClientSettingsDB({
            dashboard,
            settings,
            panelView,
            listView,
            cameraView,
            controlSettings
          });
          defaultSystemSettings.save();
          return "Server settings have been created...";
        }
      })
      .then((ret) => {
        SettingsClean.start();
      });
    return "Client settings already exist, loaded existing values...";
  }

  static check() {
    return ClientSettingsDB.find({});
  }

  static update(obj) {
    ClientSettingsDB.find({}).then((checked) => {
      SettingsClean.start();
    });
  }
}

module.exports = {
  ClientSettings
};
