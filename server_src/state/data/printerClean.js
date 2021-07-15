"use strict";

const { checkNested, checkNestedIndex } = require("../../utils/array.util");
const {
  getDefaultDashboardStatisticsObject,
  getEmptyHeatmap,
  getEmptyToolTemperatureArray,
  getEmptyOperationsObject,
  ALL_MONTHS
} = require("../../constants/cleaner.constants");
const { getHistoryCache } = require("./history.cache");
const _ = require("lodash");
const { JobClean } = require("./jobClean.js");
const fileClean = require("./fileClean.js");
const { FileClean } = fileClean;
const FarmStatisticsService = require("../../services/farm-statistics.service");
const RoomData = require("../../models/RoomData.js");
const ErrorLogs = require("../../models/ErrorLog.js");
const TempHistory = require("../../models/TempHistory.js");
const { PrinterTickerStore } = require("../printer-ticker.store.js");

const Logger = require("../../handlers/logger.js");
const { getDayName } = require("../../utils/time.util");
const logger = new Logger("OctoFarm-InformationCleaning");

let fmToggle = false;

class PrinterClean {
  #farmStatisticsService;

  #currentOperations = getEmptyOperationsObject();
  #dashboardStatistics = getDefaultDashboardStatisticsObject();
  #heatMap = getEmptyHeatmap();
  #currentHistoryTemp = getEmptyToolTemperatureArray();
  #printersInformation = [];
  #currentLogs = [];
  #previousLogs = [];
  #farmStats = null;
  #heatMapCounter = 17280;
  #arrayTotal = [];
  #printerControlList = [];
  #printerFilamentList = [];
  #printerConnectionLogs = [];

  constructor({ farmStatisticsService }) {
    this.#farmStatisticsService = farmStatisticsService;
  }

  // TODO remove or util
  static sumValuesGroupByDate(input) {
    const dates = {};
    input.forEach((dv) => (dates[dv.x] = (dates[dv.x] || 0) + dv.y));
    return Object.keys(dates).map((date) => ({
      x: new Date(date),
      y: dates[date]
    }));
  }

  static sortOtherSettings(temp, webcam, system) {
    const otherSettings = {
      temperatureTriggers: null,
      webCamSettings: null
    };
    if (typeof temp !== "undefined") {
      otherSettings.temperatureTriggers = temp;
    }
    if (typeof webcam !== "undefined") {
      otherSettings.webCamSettings = webcam;
    }
    if (typeof system !== "undefined") {
      otherSettings.system = system;
    }

    return otherSettings;
  }

  /**
   *
   * @param complete
   * @param active
   * @param offline
   * @param idle
   * @param disconnected
   * @returns {Promise<void>}
   */
  static async heatMapping(complete, active, offline, idle, disconnected) {
    // TODO this function is ... in need of a complete redo (run twice, get 2 errors)
    try {
      const today = getDayName();
      const CompleteCount = {
        x: today,
        y: 0,
        figure: 0
      };
      const ActiveCount = {
        x: today,
        y: 0,
        figure: 0
      };

      const IdleCount = {
        x: today,
        y: 0,
        figure: 0
      };
      const OfflineCount = {
        x: today,
        y: 0,
        figure: 0
      };
      const DisconnectedCount = {
        x: today,
        y: 0,
        figure: 0
      };
      if (heatMap[0].data.length === 0) {
        // Created initial data set
        heatMap[0].data.push(CompleteCount);
        heatMap[1].data.push(ActiveCount);
        heatMap[2].data.push(IdleCount);
        heatMap[3].data.push(OfflineCount);
        heatMap[4].data.push(DisconnectedCount);
      } else {
        // Cycle through current data and check if day exists...

        const currentTotal = arrayTotal.reduce((a, b) => a + b, 0);
        for (let i = 0; i < heatMap.length; i++) {
          const lastInArray = heatMap[i].data.length - 1;
          // If x = today add that fucker up!
          if (heatMap[i].data[lastInArray].x === today) {
            if (heatMap[i].name === "Completed") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);

              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + complete;
              arrayTotal[0] = heatMap[i].data[lastInArray].figure;
            }
            if (heatMap[i].name === "Active") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);

              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + active;
              arrayTotal[1] = heatMap[i].data[lastInArray].figure;
            }
            if (heatMap[i].name === "Offline") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);

              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + offline;
              arrayTotal[2] = heatMap[i].data[lastInArray].figure;
            }
            if (heatMap[i].name === "Idle") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);
              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + idle;
              arrayTotal[3] = heatMap[i].data[lastInArray].figure;
            }
            if (heatMap[i].name === "Disconnected") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);
              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure =
                heatMap[i].data[lastInArray].figure + disconnected;
              arrayTotal[4] = heatMap[i].data[lastInArray].figure;
            }
          } else {
            // Must be a new day, so shift with new heatMap
            heatMap[0].data.push(CompleteCount);
            heatMap[1].data.push(ActiveCount);
            heatMap[2].data.push(IdleCount);
            heatMap[3].data.push(OfflineCount);
            heatMap[4].data.push(DisconnectedCount);
          }
        }
      }
      // Clean up old days....
      if (heatMap[0].data.length === 8) {
        heatMap[0].data.shift();
        heatMap[1].data.shift();
        heatMap[2].data.shift();
        heatMap[3].data.shift();
        heatMap[4].data.shift();
      }

      // TODO this line throws errors regularly when its not queried yet
      farmStats[0].heatMap = heatMap;
      dashboardStatistics.utilisationGraph = heatMap;
      farmStats[0].markModified("heatMap");
      farmStats[0].save().catch((e) => logger.error(e));
    } catch (e) {
      logger.error("HEAT MAP ISSUE - farmStats[0] is empty", e.message);
    }
  }

  static getProgressColour(progress) {
    progress = parseInt(progress);
    if (progress === 0) {
      return "dark";
    }
    if (progress < 25) {
      return "secondary";
    }
    if (progress >= 25 && progress <= 50) {
      return "primary";
    }
    if (progress > 50 && progress <= 75) {
      return "info";
    }
    if (progress > 75 && progress < 100) {
      return "warning";
    }
    if (progress === 100) {
      return "success";
    }
  }

  static checkTempRange(state, target, actual, heatingVariation, coolDown) {
    if (state === "Active" || state === "Idle") {
      if (
        actual > target - parseInt(heatingVariation) &&
        actual < target + parseInt(heatingVariation)
      ) {
        return "tempSuccess";
      }
      return "tempActive";
    }
    if (state === "Complete") {
      if (actual > parseInt(coolDown)) {
        return "tempCooling";
      }
      return "tempCool";
    }
    // Offline
    return "tempOffline";
  }

  async generatePrinterStatistics(id) {
    const historyCache = getHistoryCache().historyClean;
    let currentHistory = JSON.parse(JSON.stringify(historyCache));
    let currentPrinters = this.#printersInformation;
    const i = _.findIndex(currentPrinters, function (o) {
      return JSON.stringify(o._id) === JSON.stringify(id);
    });
    let printer = Object.assign({}, currentPrinters[i]);

    // Calculate time printer has existed...
    let dateAdded = new Date(printer.dateAdded);
    let todaysDate = new Date();
    let dateDifference = parseInt(todaysDate - dateAdded);
    let sevenDaysAgo = new Date(todaysDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    let ninetyDaysAgo = new Date(todaysDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    // Filter down the history arrays for total/daily/weekly
    let historyDaily = [];
    let historyWeekly = [];

    // Create the statistics object to be sent back to client
    let printerStatistics = {
      printerName: printer.printerName,
      timeTotal: dateDifference,
      activeTimeTotal: printer.currentActive,
      idleTimeTotal: printer.currentIdle,
      offlineTimeTotal: printer.currentOffline,
      printerUtilisation: [],
      filamentUsedWeightTotal: [],
      filamentUsedLengthTotal: [],
      printerCostTotal: [],
      filamentCostTotal: [],
      filamentUsedWeightWeek: [],
      filamentUsedLengthWeek: [],
      printerCostWeek: [],
      filamentCostWeek: [],
      filamentUsedWeightDay: [],
      filamentUsedLengthDay: [],
      printerCostDay: [],
      filamentCostDay: [],
      printSuccessTotal: [],
      printCancelTotal: [],
      printErrorTotal: [],
      printSuccessDay: [],
      printCancelDay: [],
      printErrorDay: [],
      printerSuccessWeek: [],
      printerCancelWeek: [],
      printerErrorWeek: [],
      printerResendRatioTotal: [],
      printerResendRatioDaily: [],
      printerResendRatioWeekly: [],
      historyByDay: [],
      historyByDayIncremental: [],
      octoPrintSystemInfo: printer.octoPrintSystemInfo
    };
    //Generate utilisation chart
    const totalTime = printer.currentActive + printer.currentIdle + printer.currentOffline;
    printerStatistics.printerUtilisation.push((printer.currentActive / totalTime) * 100);
    printerStatistics.printerUtilisation.push((printer.currentIdle / totalTime) * 100);
    printerStatistics.printerUtilisation.push((printer.currentOffline / totalTime) * 100);

    currentHistory.forEach((h) => {
      // Parse the date from history....
      let dateSplit = h.endDate.split(" ");
      let month = ALL_MONTHS.indexOf(dateSplit[1]);
      let dateString = `${parseInt(dateSplit[3])}-${month + 1}-${parseInt(dateSplit[2])}`;
      let dateParse = new Date(dateString);
      if (h.printer === printerStatistics.printerName) {
        //Collate totals
        printerStatistics.filamentUsedWeightTotal.push(h.totalWeight);
        printerStatistics.filamentUsedLengthTotal.push(h.totalLength);
        printerStatistics.printerCostTotal.push(parseFloat(h.totalCost));
        printerStatistics.filamentCostTotal.push(h.spoolCost);
        if (typeof h.resend !== "undefined") {
          printerStatistics.printerResendRatioTotal.push(h.resend.ratio);
        }

        if (h.state.includes("success")) {
          printerStatistics.printSuccessTotal.push(1);
        } else if (h.state.includes("warning")) {
          printerStatistics.printCancelTotal.push(1);
        } else if (h.state.includes("danger")) {
          printerStatistics.printErrorTotal.push(1);
        }

        if (dateParse.getTime() > todaysDate.getTime()) {
          historyDaily.push(h);
        }
        // Capture Weekly..
        if (dateParse.getTime() > sevenDaysAgo.getTime()) {
          historyWeekly.push(h);
        }
        let successEntry = checkNested("Success", printerStatistics.historyByDay);
        //
        if (typeof successEntry !== "undefined") {
          let checkNestedIndexHistoryRates = null;
          if (h.state.includes("success")) {
            checkNestedIndexHistoryRates = checkNestedIndex(
              "Success",
              printerStatistics.historyByDay
            );
          } else if (h.state.includes("warning")) {
            checkNestedIndexHistoryRates = checkNestedIndex(
              "Cancelled",
              printerStatistics.historyByDay
            );
          } else if (h.state.includes("danger")) {
            checkNestedIndexHistoryRates = checkNestedIndex(
              "Failed",
              printerStatistics.historyByDay
            );
          } else {
            return;
          }

          //Check if more than 30 days ago...
          if (dateParse.getTime() > ninetyDaysAgo.getTime()) {
            printerStatistics.historyByDay[checkNestedIndexHistoryRates].data.push({
              x: dateParse,
              y: 1
            });
          }
        } else {
          let successKey = {
            name: "Success",
            data: []
          };
          let cancellKey = {
            name: "Cancelled",
            data: []
          };
          let failedKey = {
            name: "Failed",
            data: []
          };
          if (typeof printerStatistics.historyByDay[0] === "undefined") {
            printerStatistics.historyByDay.push(successKey);
            printerStatistics.historyByDay.push(cancellKey);
            printerStatistics.historyByDay.push(failedKey);
          }
        }
      }
    });

    // Collate daily stats
    historyDaily.forEach((d) => {
      printerStatistics.filamentUsedWeightDay.push(d.totalWeight);
      printerStatistics.filamentUsedLengthDay.push(d.totalLength);
      printerStatistics.printerCostDay.push(parseFloat(d.totalCost));
      printerStatistics.filamentCostDay.push(d.spoolCost);
      if (typeof d.resend !== "undefined") {
        printerStatistics.printerResendRatioDaily.push(d.resend.ratio);
      }

      if (d.state.includes("success")) {
        printerStatistics.printSuccessDay.push(1);
      } else if (d.state.includes("warning")) {
        printerStatistics.printCancelDay.push(1);
      } else if (d.state.includes("danger")) {
        printerStatistics.printErrorDay.push(1);
      }
    });

    // Collate weekly stats
    historyWeekly.forEach((w) => {
      printerStatistics.filamentUsedWeightWeek.push(w.totalWeight);
      printerStatistics.filamentUsedLengthWeek.push(w.totalLength);
      printerStatistics.printerCostWeek.push(parseFloat(w.totalCost));
      printerStatistics.filamentCostWeek.push(w.spoolCost);
      if (typeof w.resend !== "undefined") {
        printerStatistics.printerResendRatioWeekly.push(w.resend.ratio);
      }

      if (w.state.includes("success")) {
        printerStatistics.printerSuccessWeek.push(1);
      } else if (w.state.includes("warning")) {
        printerStatistics.printerCancelWeek.push(1);
      } else if (w.state.includes("danger")) {
        printerStatistics.printerErrorWeek.push(1);
      }
    });
    // Reduce all the values and update the variable.
    Object.keys(printerStatistics).forEach(function (key) {
      if (Array.isArray(printerStatistics[key])) {
        if (
          key !== "historyByDay" &&
          key !== "historyByDayIncremental" &&
          key !== "printerUtilisation"
        ) {
          printerStatistics[key] = printerStatistics[key].reduce((a, b) => a + b, 0);
        }
      }
    });

    printerStatistics.historyByDay.forEach((usage) => {
      usage.data = PrinterClean.sumValuesGroupByDate(usage.data);
    });

    return printerStatistics;
  }

  generate(farmPrinter, filamentManager) {
    fmToggle = filamentManager;
    try {
      if (typeof farmPrinter.systemChecks !== "undefined") {
        farmPrinter.systemChecks.cleaning.information.status = "warning";
      }

      const sortedPrinter = {
        _id: farmPrinter._id,
        sortIndex: farmPrinter.sortIndex,
        hostState: {
          state: farmPrinter.hostState,
          colour: farmPrinter.hostStateColour,
          desc: farmPrinter.hostDescription
        },
        printerState: {
          state: farmPrinter.state,
          colour: farmPrinter.stateColour,
          desc: farmPrinter.stateDescription
        },
        webSocketState: {
          colour: farmPrinter.webSocket,
          desc: farmPrinter.webSocketDescription
        },
        group: farmPrinter.group,
        groups: [], // TODO unfinished feature
        printerURL: farmPrinter.printerURL,
        webSocketURL: farmPrinter.webSocketURL,
        cameraURL: farmPrinter.camURL,
        apikey: farmPrinter.apikey,
        octoPrintVersion: farmPrinter.octoPrintVersion,
        flowRate: farmPrinter.flowRate,
        feedRate: farmPrinter.feedRate,
        stepRate: farmPrinter.stepRate,
        systemChecks: farmPrinter.systemChecks,
        currentIdle: farmPrinter.currentIdle,
        currentActive: farmPrinter.currentActive,
        currentOffline: farmPrinter.currentOffline,
        dateAdded: farmPrinter.dateAdded,
        corsCheck: farmPrinter.corsCheck,
        currentUser: farmPrinter.currentUser,
        octoPrintUpdate: farmPrinter.octoPrintUpdate,
        octoPrintPluginUpdates: farmPrinter.octoPrintPluginUpdates,
        display: true,
        order: farmPrinter.sortIndex,
        octoPrintSystemInfo: farmPrinter.octoPrintSystemInfo
      };

      if (typeof farmPrinter.resends !== "undefined" && farmPrinter.resends !== null) {
        sortedPrinter.resends = farmPrinter.resends;
      }
      sortedPrinter.tools = PrinterClean.sortTemps(farmPrinter.temps);
      sortedPrinter.currentJob = JobClean.getCleanJobAtIndex(farmPrinter.sortIndex);
      sortedPrinter.selectedFilament = farmPrinter.selectedFilament;

      sortedPrinter.fileList = FileClean.returnFiles(farmPrinter.sortIndex);
      sortedPrinter.currentProfile = PrinterClean.sortProfile(
        farmPrinter.profiles,
        farmPrinter.current
      );
      sortedPrinter.currentConnection = PrinterClean.sortConnection(farmPrinter.current);
      sortedPrinter.connectionOptions = farmPrinter.options;
      if (
        !!sortedPrinter?.connectionOptions?.ports &&
        !sortedPrinter.connectionOptions.ports.includes("AUTO")
      ) {
        sortedPrinter.connectionOptions.baudrates.unshift(0);
        sortedPrinter.connectionOptions.ports.unshift("AUTO");
      }
      sortedPrinter.terminal = PrinterClean.sortTerminal(farmPrinter.sortIndex, farmPrinter.logs);
      sortedPrinter.costSettings = farmPrinter.costSettings;
      sortedPrinter.powerSettings = farmPrinter.powerSettings;
      sortedPrinter.gcodeScripts = PrinterClean.sortGCODE(farmPrinter.settingsScripts);
      sortedPrinter.otherSettings = PrinterClean.sortOtherSettings(
        farmPrinter.tempTriggers,
        farmPrinter.settingsWebcam,
        farmPrinter.settingsServer
      );
      sortedPrinter.printerName = PrinterClean.grabPrinterName(farmPrinter);
      sortedPrinter.storage = farmPrinter.storage;
      sortedPrinter.tempHistory = farmPrinter.tempHistory;

      if (typeof farmPrinter.octoPi !== "undefined") {
        sortedPrinter.octoPi = farmPrinter.octoPi;
      }
      sortedPrinter.connectionLog = this.#printerConnectionLogs[farmPrinter.sortIndex];
      if (typeof farmPrinter.klipperFirmwareVersion !== "undefined") {
        sortedPrinter.klipperFirmwareVersion = farmPrinter.klipperFirmwareVersion.substring(0, 6);
      }
      const printerIndex = _.findIndex(this.#printerControlList, function (o) {
        return o.printerName === sortedPrinter.printerName;
      });
      if (printerIndex !== -1) {
        this.#printerControlList[printerIndex] = {
          printerName: sortedPrinter.printerName,
          printerID: sortedPrinter._id,
          state: sortedPrinter.printerState.colour
        };
      } else {
        this.#printerControlList.push({
          printerName: sortedPrinter.printerName,
          printerID: sortedPrinter._id,
          state: sortedPrinter.printerState.colour
        });
      }
      if (typeof farmPrinter.systemChecks !== "undefined") {
        farmPrinter.systemChecks.cleaning.information.status = "success";
        farmPrinter.systemChecks.cleaning.information.date = new Date();
      }
      this.#printersInformation[farmPrinter.sortIndex] = sortedPrinter;
    } catch (e) {
      logger.error(e);
    }
  }

  async generateConnectionLogs(farmPrinter) {
    let printerErrorLogs = await ErrorLogs.find({});

    let currentOctoFarmLogs = [];
    let currentErrorLogs = [];
    let currentTempLogs = [];
    let currentOctoPrintLogs = [];
    for (let e = 0; e < printerErrorLogs.length; e++) {
      if (
        typeof printerErrorLogs[e].errorLog.printerID !== "undefined" &&
        JSON.stringify(printerErrorLogs[e].errorLog.printerID) === JSON.stringify(farmPrinter._id)
      ) {
        let errorFormat = {
          date: printerErrorLogs[e].errorLog.endDate,
          message: printerErrorLogs[e].errorLog.reason,
          printer: farmPrinter.printerURL,
          state: "Offline"
        };
        currentErrorLogs.push(errorFormat);
      }
    }
    let currentIssues = await PrinterTickerStore.returnIssue();
    for (let i = 0; i < currentIssues.length; i++) {
      if (JSON.stringify(currentIssues[i].printerID) === JSON.stringify(farmPrinter._id)) {
        let errorFormat = {
          date: currentIssues[i].date,
          message: currentIssues[i].message,
          printer: currentIssues[i].printer,
          state: currentIssues[i].state
        };
        currentOctoFarmLogs.push(errorFormat);
      }
    }

    let octoprintLogs = await PrinterTickerStore.returnOctoPrintLogs();
    for (let i = 0; i < octoprintLogs.length; i++) {
      if (JSON.stringify(octoprintLogs[i].printerID) === JSON.stringify(farmPrinter._id)) {
        let octoFormat = {
          date: octoprintLogs[i].date,
          message: octoprintLogs[i].message,
          printer: octoprintLogs[i].printer,
          pluginDisplay: octoprintLogs[i].pluginDisplay,
          state: octoprintLogs[i].state
        };
        currentOctoPrintLogs.push(octoFormat);
      }
    }

    let tempHistory = await TempHistory.find({
      printer_id: farmPrinter._id
    })
      .sort({ _id: -1 })
      .limit(500);
    if (typeof tempHistory !== "undefined") {
      for (let h = 0; h < tempHistory.length; h++) {
        let hist = tempHistory[h].currentTemp;
        const reFormatTempHistory = async function (tempHistory) {
          // create a new object to store full name.
          let keys = Object.keys(tempHistory);
          let array = [];

          for (let k = 0; k < keys.length; k++) {
            if (keys[k] !== "time") {
              let target = {};
              let actual = {};
              target = {
                name: keys[k] + "-target",
                data: []
              };
              actual = {
                name: keys[k] + "-actual",
                data: []
              };
              array.push(target);
              array.push(actual);
            }
          }

          // return our new object.
          return array;
        };
        currentTempLogs = await reFormatTempHistory(hist);
      }
      if (currentTempLogs.length > 0) {
        for (let h = 0; h < tempHistory.length; h++) {
          let hist = tempHistory[h].currentTemp;
          let keys = Object.keys(hist);
          for (let k = 0; k < keys.length; k++) {
            if (keys[k] !== "time") {
              let actual = {
                x: hist["time"],
                y: hist[keys[k]].actual
              };
              let target = {
                x: hist["time"],
                y: hist[keys[k]].target
              };

              //get array position...
              let arrayTarget = currentTempLogs
                .map(function (e) {
                  return e.name;
                })
                .indexOf(keys[k] + "-target");
              let arrayActual = currentTempLogs
                .map(function (e) {
                  return e.name;
                })
                .indexOf(keys[k] + "-actual");
              if (currentTempLogs[arrayTarget].data.length <= tempHistory.length) {
                currentTempLogs[arrayTarget].data.push(target);
              }
              if (currentTempLogs[arrayActual].data.length <= tempHistory.length) {
                currentTempLogs[arrayActual].data.push(actual);
              }
            }
          }
        }
      }
    }

    currentErrorLogs = _.orderBy(currentErrorLogs, ["date"], ["desc"]);
    currentOctoFarmLogs = _.orderBy(currentOctoFarmLogs, ["date"], ["desc"]);
    currentTempLogs = _.orderBy(currentTempLogs, ["date"], ["desc"]);
    currentOctoPrintLogs = _.orderBy(currentOctoPrintLogs, ["date"], ["desc"]);

    return {
      currentErrorLogs,
      currentOctoFarmLogs,
      currentTempLogs,
      currentOctoPrintLogs
    };
  }

  async createPrinterList(farmPrinters, filamentManager) {
    const printerList = ['<option value="0">Not Assigned</option>'];
    farmPrinters.forEach((printer) => {
      if (typeof printer.currentProfile !== "undefined" && printer.currentProfile !== null) {
        for (let i = 0; i < printer.currentProfile.extruder.count; i++) {
          let listing = null;
          if (filamentManager) {
            if (
              printer.printerState.colour.category === "Offline" ||
              printer.printerState.colour.category === "Active"
            ) {
              listing = `<option value="${printer._id}-${i}" disabled>${printer.printerName}: Tool ${i}</option>`;
            } else {
              listing = `<option value="${printer._id}-${i}">${printer.printerName}: Tool ${i}</option>`;
            }
          } else {
            listing = `<option value="${printer._id}-${i}">${printer.printerName}: Tool ${i}</option>`;
          }

          printerList.push(listing);
        }
      }
    });

    this.#printerFilamentList = printerList;
  }

  async sortTerminal(i, logs) {
    if (typeof logs !== "undefined") {
      if (!this.#currentLogs[i]) {
        this.#currentLogs[i] = [];
      } else {
        if (logs.length === 1) {
          if (this.#currentLogs[i][this.#currentLogs[i].length - 1] !== logs[0]) {
            this.#currentLogs[i].push(logs[0]);
          }
          if (this.#currentLogs[i].length >= 100) {
            this.#currentLogs[i].shift();
          }
        } else {
          for (let l = 0; l < logs.length; l++) {
            if (this.#currentLogs[i][this.#currentLogs[i].length - 1] !== logs[l]) {
              this.#currentLogs[i].push(logs[l]);
            }
            if (this.#currentLogs[i].length >= 100) {
              this.#currentLogs[i].shift();
            }
          }
          this.#previousLogs[i] = this.#currentLogs[i];
        }
      }
    } else {
      this.#currentLogs[i] = [];
    }
    return this.#currentLogs[i];
  }

  async sortGCODE(settings) {
    return settings.gcode || null;
  }

  async sortConnection(current) {
    if (!current) return null;
    return {
      baudrate: current.baudrate,
      port: current.port,
      printerProfile: current.printerProfile
    };
  }

  sortProfile(profile, current) {
    if (!profile || !current) return null;
    return profile[current.printerProfile];
  }

  sortTemps(temps) {
    return temps || null;
  }

  grabPrinterName(printer) {
    let name = null;
    if (!!printer.settingsAppearance) {
      if (printer.settingsAppearance.name === "" || printer.settingsAppearance.name === null) {
        name = printer.printerURL;
      } else {
        name = printer.settingsAppearance.name;
      }
    } else {
      name = printer.printerURL;
    }
    return name;
  }

  async sortCurrentOperations(farmPrinters) {
    const complete = [];
    const active = [];
    const idle = [];
    const offline = [];
    const disconnected = [];
    const progress = [];
    const operations = [];
    try {
      for (let i = 0; i < farmPrinters.length; i++) {
        const printer = farmPrinters[i];
        if (typeof printer !== "undefined") {
          const name = printer.printerName;

          if (typeof printer.printerState !== "undefined") {
            if (printer.printerState.colour.category === "Idle") {
              idle.push(printer._id);
            }
            if (printer.printerState.colour.category === "Offline") {
              offline.push(printer._id);
            }
            if (printer.printerState.colour.category === "Disconnected") {
              disconnected.push(printer._id);
            }
          }

          if (typeof printer.printerState !== "undefined" && printer.currentJob != null) {
            // TODO toString error if not present
            let id = printer._id;
            id = id.toString();
            if (printer.printerState.colour.category === "Complete") {
              complete.push(printer._id);
              progress.push(printer.currentJob.progress);
              operations.push({
                index: id,
                name,
                progress: Math.floor(printer.currentJob.progress),
                progressColour: "success",
                timeRemaining: printer.currentJob.printTimeRemaining,
                fileName: printer.currentJob.fileDisplay
              });
            }

            if (
              printer.printerState.colour.category === "Active" &&
              typeof printer.currentJob !== "undefined"
            ) {
              active.push(printer._id);
              progress.push(printer.currentJob.progress);
              operations.push({
                index: id,
                name,
                progress: Math.floor(printer.currentJob.progress),
                progressColour: "warning",
                timeRemaining: printer.currentJob.printTimeRemaining,
                fileName: printer.currentJob.fileDisplay
              });
            }
          }
        }
      }

      const actProg = progress.reduce((a, b) => a + b, 0);

      this.#currentOperations.count.farmProgress = Math.floor(actProg / progress.length);

      if (isNaN(this.#currentOperations.count.farmProgress)) {
        this.#currentOperations.count.farmProgress = 0;
      }
      if (this.#currentOperations.count.farmProgress === 100) {
        this.#currentOperations.count.farmProgressColour = "success";
      } else {
        this.#currentOperations.count.farmProgressColour = "warning";
      }
      // 17280

      if (this.#heatMapCounter >= 17280) {
        await PrinterClean.heatMapping(
          this.#currentOperations.count.complete,
          this.#currentOperations.count.active,
          this.#currentOperations.count.offline,
          this.#currentOperations.count.idle,
          this.#currentOperations.count.disconnected
        );

        this.#heatMapCounter = 0;
      } else {
        this.#heatMapCounter += 1728;
      }

      this.#currentOperations.count.printerCount = farmPrinters.length;
      this.#currentOperations.count.complete = complete.length;
      this.#currentOperations.count.active = active.length;
      this.#currentOperations.count.offline = offline.length;
      this.#currentOperations.count.idle = idle.length;
      this.#currentOperations.count.disconnected = disconnected.length;

      this.#currentOperations.operations = _.orderBy(operations, ["progress"], ["desc"]);
    } catch (err) {
      logger.error(`Current Operations issue: ${err}`);
    }
  }

  async statisticsStart() {
    const historyStats = getHistoryCache().statisticsClean;

    this.#dashboardStatistics.currentUtilisation = [
      {
        data: [
          this.#currentOperations.count.active,
          this.#currentOperations.count.complete,
          this.#currentOperations.count.idle,
          this.#currentOperations.count.disconnected,
          this.#currentOperations.count.offline
        ]
      }
    ];

    const farmTotal =
      this.#currentOperations.count.active +
      this.#currentOperations.count.complete +
      this.#currentOperations.count.idle +
      this.#currentOperations.count.disconnected +
      this.#currentOperations.count.offline;
    const activeTotal = this.#currentOperations.count.active;
    const offlineTotal = this.#currentOperations.count.offline;
    const idleTotal =
      this.#currentOperations.count.complete +
      this.#currentOperations.count.idle +
      this.#currentOperations.count.disconnected;
    const activePer = (activeTotal / farmTotal) * 100;
    const idlePer = (idleTotal / farmTotal) * 100;
    const offlinePer = (offlineTotal / farmTotal) * 100;
    this.#dashboardStatistics.currentStatus = [activePer, idlePer, offlinePer];

    const arrayEstimated = [];
    const arrayRemaining = [];
    const arrayElapsed = [];

    const arrayIdle = [];
    const arrayActive = [];
    const arrayOffline = [];
    const heatStatus = [];
    const heatProgress = [];
    const heatTemps = [];
    const heatUtilisation = [];

    const arrayGlobalToolTempActual = [];
    const arrayGlobalToolTempTarget = [];
    const arrayGlobalBedTempActual = [];
    const arrayGlobalBedTempTarget = [];
    const arrayGlobalChamberTempActual = [];
    const arrayGlobalChamberTempTarget = [];
    for (let p = 0; p < this.#printersInformation.length; p++) {
      const printer = this.#printersInformation[p];
      if (typeof printer !== "undefined") {
        if (typeof printer.currentJob !== "undefined") {
          if (printer.currentJob.expectedPrintTime !== null) {
            arrayEstimated.push(printer.currentJob.expectedPrintTime);
          }
          if (printer.currentJob.expectedPrintTime !== null) {
            arrayRemaining.push(printer.currentJob.printTimeRemaining);
          }
          if (printer.currentJob.expectedPrintTime !== null) {
            arrayElapsed.push(printer.currentJob.printTimeElapsed);
          }
        }
        arrayIdle.push(printer.currentIdle);
        arrayActive.push(printer.currentActive);
        arrayOffline.push(printer.currentOffline);
        if (typeof printer.printerState !== "undefined") {
          const status = printer.printerState.colour.category;
          let colour = printer.printerState.colour.name;
          if (printer.printerState.colour.category === "Offline") {
            colour = "offline";
          }
          heatStatus.push(
            `<div title="${printer.printerName}: ${status}" class="bg-${colour} heatMap"></div>`
          );
          let tools = null;
          if (
            printer.printerState.colour.category === "Active" ||
            printer.printerState.colour.category === "Complete"
          ) {
            tools = printer.tools;
          } else {
            tools = [];
            tools.push({
              bed: {
                actual: 0,
                target: 0
              },
              tool0: {
                actual: 0,
                target: 0
              }
            });
          }
          if (typeof tools !== "undefined" && tools !== null) {
            const rightString = [`${printer.printerName}: `];
            const leftString = [`${printer.printerName}: `];
            const arrayToolActual = [];
            const arrayToolTarget = [];
            const arrayOtherActual = [];
            const arrayOtherTarget = [];
            const keys = Object.keys(tools[0]);
            for (let k = 0; k < keys.length; k++) {
              if (
                typeof printer.currentProfile !== "undefined" &&
                printer.currentProfile !== null
              ) {
                if (printer.currentProfile.heatedChamber && keys[k] === "chamber") {
                  let actual = "";
                  let target = "";
                  if (
                    printer.tools !== null &&
                    printer.tools[0][keys[k]].actual !== null &&
                    printer.tools[0][keys[k]].target >= 10
                  ) {
                    actual = `Chamber A: ${printer.tools[0][keys[k]].actual}°C `;
                    arrayOtherActual.push(printer.tools[0][keys[k]].actual);
                    arrayGlobalChamberTempActual.push(printer.tools[0][keys[k]].actual);
                  } else {
                    actual = `Chamber A: ${0}°C`;
                  }
                  if (
                    printer.tools !== null &&
                    printer.tools[0][keys[k]].target !== null &&
                    printer.tools[0][keys[k]].target >= 10
                  ) {
                    target = `Chamber T: ${printer.tools[0][keys[k]].target}°C `;
                    arrayOtherTarget.push(printer.tools[0][keys[k]].target);
                    arrayGlobalChamberTempTarget.push(printer.tools[0][keys[k]].target);
                  } else {
                    target = `Chamber T: ${0}°C`;
                  }
                  rightString[2] = `${actual}, ${target}`;
                }
                if (
                  printer.tools !== null &&
                  printer.currentProfile.heatedBed &&
                  keys[k] === "bed"
                ) {
                  let actual = "";
                  let target = "";
                  if (
                    printer.tools[0][keys[k]].actual !== null &&
                    printer.tools[0][keys[k]].target >= 10
                  ) {
                    actual = `Bed A: ${printer.tools[0][keys[k]].actual}°C `;
                    arrayOtherActual.push(printer.tools[0][keys[k]].actual);
                    arrayGlobalBedTempActual.push(printer.tools[0][keys[k]].actual);
                  } else {
                    actual = `Bed A: ${0}°C`;
                  }
                  if (
                    printer.tools[0][keys[k]].target !== null &&
                    printer.tools[0][keys[k]].target >= 10
                  ) {
                    target = `Bed T: ${printer.tools[0][keys[k]].target}°C `;
                    arrayOtherTarget.push(printer.tools[0][keys[k]].target);
                    arrayGlobalBedTempTarget.push(printer.tools[0][keys[k]].target);
                  } else {
                    target = `Bed T: ${0}°C`;
                  }
                  rightString[1] = `${actual}, ${target}`;
                }
                if (keys[k].includes("tool")) {
                  const toolNumber = keys[k].replace("tool", "");
                  let actual = "";
                  let target = "";
                  if (
                    printer.tools !== null &&
                    printer.tools[0][keys[k]].actual !== null &&
                    printer.tools[0][keys[k]].target >= 10
                  ) {
                    actual = `Tool ${toolNumber} A: ${printer.tools[0][keys[k]].actual}°C `;
                    arrayToolActual.push(printer.tools[0][keys[k]].actual);
                    arrayGlobalToolTempActual.push(printer.tools[0][keys[k]].actual);
                  } else {
                    actual = `Tool ${toolNumber} A: 0°C`;
                  }
                  if (
                    printer.tools !== null &&
                    printer.tools[0][keys[k]].target !== null &&
                    printer.tools[0][keys[k]].target >= 10
                  ) {
                    target = `Tool ${toolNumber} T: ${printer.tools[0][keys[k]].target}°C `;
                    arrayToolTarget.push(printer.tools[0][keys[k]].target);
                    arrayGlobalToolTempTarget.push(printer.tools[0][keys[k]].target);
                  } else {
                    target = `Tool ${toolNumber} T: 0°C`;
                  }
                  leftString[parseInt(toolNumber) + 1] = `${actual}, ${target}`;
                }
              } else {
                leftString[1] = "Offline";
                rightString[1] = "Offline";
              }
            }
            const totalToolActual = arrayToolActual.reduce((a, b) => a + b, 0);
            const totalToolTarget = arrayToolTarget.reduce((a, b) => a + b, 0);
            const totalOtherActual = arrayOtherActual.reduce((a, b) => a + b, 0);
            const totalOtherTarget = arrayToolActual.reduce((a, b) => a + b, 0);
            let actualString = '<div class="d-flex flex-wrap"><div title="';
            for (let l = 0; l < leftString.length; l++) {
              actualString += `${leftString[l]}`;
            }
            actualString += `" class="${PrinterClean.checkTempRange(
              printer.printerState.colour.category,
              totalToolTarget,
              totalToolActual,
              printer.otherSettings.temperatureTriggers.heatingVariation,
              printer.otherSettings.temperatureTriggers.coolDownf
            )} heatMapLeft"></div>`;
            actualString += '<div title="';
            for (let r = 0; r < rightString.length; r++) {
              actualString += `${rightString[r]}`;
            }
            actualString += `" class="${PrinterClean.checkTempRange(
              printer.printerState.colour.category,
              totalOtherTarget,
              totalOtherActual,
              printer.otherSettings.temperatureTriggers.heatingVariation,
              printer.otherSettings.temperatureTriggers.coolDown
            )} heatMapLeft"></div></div>`;
            heatTemps.push(actualString);
          }
          let progress = 0;
          if (typeof printer.currentJob !== "undefined" && printer.currentJob.progress !== null) {
            progress = printer.currentJob.progress.toFixed(0);
          }
          heatProgress.push(
            `<div title="${
              printer.printerName
            }: ${progress}%" class="bg-${PrinterClean.getProgressColour(progress)} heatMap"></div>`
          );
        }
        const printerUptime = printer.currentActive + printer.currentIdle + printer.currentOffline;
        const percentUp = (printer.currentActive / printerUptime) * 100;
        heatUtilisation.push(
          `<div title="${printer.printerName}: ${percentUp.toFixed(
            0
          )}" class="bg-${PrinterClean.getProgressColour(percentUp)} heatMap"></div>`
        );
      }
    }
    let timeStamp = new Date();
    timeStamp = timeStamp.getTime();
    const totalGlobalToolTempActual = arrayGlobalToolTempActual.reduce((a, b) => a + b, 0);
    const totalGlobalToolTempTarget = arrayGlobalToolTempTarget.reduce((a, b) => a + b, 0);
    const totalGlobalBedTempActual = arrayGlobalBedTempActual.reduce((a, b) => a + b, 0);
    const totalGlobalBedTempTarget = arrayGlobalBedTempTarget.reduce((a, b) => a + b, 0);
    const totalGlobalChamberTempActual = arrayGlobalChamberTempActual.reduce((a, b) => a + b, 0);
    const totalGlobalChamberTempTarget = arrayGlobalChamberTempTarget.reduce((a, b) => a + b, 0);
    const totalGlobalTemp =
      totalGlobalToolTempActual + totalGlobalBedTempActual + totalGlobalChamberTempActual;
    this.#currentHistoryTemp[0].data.push({
      x: timeStamp,
      y: totalGlobalToolTempActual
    });
    this.#currentHistoryTemp[1].data.push({
      x: timeStamp,
      y: totalGlobalToolTempTarget
    });
    this.#currentHistoryTemp[2].data.push({
      x: timeStamp,
      y: totalGlobalBedTempActual
    });
    this.#currentHistoryTemp[3].data.push({
      x: timeStamp,
      y: totalGlobalBedTempTarget
    });
    this.#currentHistoryTemp[4].data.push({
      x: timeStamp,
      y: totalGlobalChamberTempActual
    });
    this.#currentHistoryTemp[5].data.push({
      x: timeStamp,
      y: totalGlobalChamberTempTarget
    });
    if (this.#currentHistoryTemp[0].data.length > 720) {
      this.#currentHistoryTemp[0].data.shift();
      this.#currentHistoryTemp[1].data.shift();
      this.#currentHistoryTemp[2].data.shift();
      this.#currentHistoryTemp[3].data.shift();
      this.#currentHistoryTemp[4].data.shift();
      this.#currentHistoryTemp[5].data.shift();
    }
    this.#dashboardStatistics.temperatureGraph = this.#currentHistoryTemp;
    const totalEstimated = arrayEstimated.reduce((a, b) => a + b, 0);
    const totalRemaining = arrayRemaining.reduce((a, b) => a + b, 0);
    const totalElapsed = arrayElapsed.reduce((a, b) => a + b, 0);
    const averageEstimated = totalEstimated / arrayEstimated.length;
    const averageRemaining = totalRemaining / arrayRemaining.length;
    const averageElapsed = totalElapsed / arrayElapsed.length;
    const cumulativePercent = (totalElapsed / totalEstimated) * 100;
    const cumulativePercentRemaining = 100 - cumulativePercent;
    const averagePercent = (averageElapsed / averageEstimated) * 100;
    const averagePercentRemaining = 100 - averagePercent;
    this.#dashboardStatistics.timeEstimates = {
      totalElapsed,
      totalRemaining,
      totalEstimated,
      averageElapsed,
      averageRemaining,
      averageEstimated,
      cumulativePercent,
      cumulativePercentRemaining,
      averagePercent,
      averagePercentRemaining,
      totalFarmTemp: totalGlobalTemp
    };

    const activeHours = arrayActive.reduce((a, b) => a + b, 0);
    const idleHours = arrayIdle.reduce((a, b) => a + b, 0);
    const offlineHours = arrayOffline.reduce((a, b) => a + b, 0);
    const failedHours = historyStats.currentFailed;
    const totalHours = historyStats.currentFailed + activeHours + idleHours + offlineHours;
    const activePercent = (activeHours / totalHours) * 100;
    const offlinePercent = (offlineHours / totalHours) * 100;
    const idlePercent = (idleHours / totalHours) * 100;
    const failedPercent = (failedHours / totalHours) * 100;

    this.#dashboardStatistics.farmUtilisation = {
      activeHours,
      failedHours,
      idleHours,
      offlineHours,
      activeHoursPercent: activePercent,
      failedHoursPercent: failedPercent,
      idleHoursPercent: idlePercent,
      offlineHoursPercent: offlinePercent
    };
    this.#dashboardStatistics.printerHeatMaps = {
      heatStatus,
      heatProgress,
      heatTemps,
      heatUtilisation
    };

    // TODO this is old old code
    //Find min / max values for gas_resistance to tweak calulation...
    RoomData.find({})
      .sort({ _id: -1 })
      .limit(500)
      .exec((err, posts) => {
        const currentEnviromentalData = [
          {
            name: "Temperature",
            data: []
          },
          {
            name: "Humidity",
            data: []
          },
          {
            name: "Pressure",
            data: []
          },
          {
            name: "IAQ",
            data: []
          }
        ];

        const enviromentalData = posts;
        if (!!enviromentalData) {
          for (let i = 0; i < enviromentalData.length; i++) {
            if (!!enviromentalData[i].temperature) {
              currentEnviromentalData[0].data.push({
                x: enviromentalData[i].date,
                y: enviromentalData[i].temperature.toFixed(2)
              });
              this.#dashboardStatistics.currentTemperature =
                enviromentalData[0].temperature.toFixed(2);
            } else {
              currentEnviromentalData[0].data.push({
                x: enviromentalData[i].date,
                y: null
              });
            }
            if (!!enviromentalData[i].humidity) {
              currentEnviromentalData[1].data.push({
                x: enviromentalData[i].date,
                y: enviromentalData[i].humidity.toFixed(0)
              });
              this.#dashboardStatistics.currentHumidity = enviromentalData[0].humidity;
            } else {
              currentEnviromentalData[1].data.push({
                x: enviromentalData[i].date,
                y: null
              });
            }
            if (
              typeof enviromentalData[i].pressure !== "undefined" &&
              enviromentalData[i].pressure !== null
            ) {
              currentEnviromentalData[2].data.push({
                x: enviromentalData[i].date,
                y: enviromentalData[i].pressure.toFixed(0)
              });
              this.#dashboardStatistics.currentPressure = enviromentalData[0].pressure.toFixed(0);
            } else {
              currentEnviromentalData[2].data.push({
                x: enviromentalData[i].date,
                y: null
              });
            }
            if (
              typeof enviromentalData[i].iaq !== "undefined" &&
              enviromentalData[i].iaq !== null
            ) {
              currentEnviromentalData[3].data.push({
                x: enviromentalData[i].date,
                y: enviromentalData[i].iaq.toFixed(0)
              });
              this.#dashboardStatistics.currentIAQ = enviromentalData[0].iaq.toFixed(0);
            } else {
              currentEnviromentalData[3].data.push({
                x: enviromentalData[i].date,
                y: null
              });
            }
          }
        }
        this.#dashboardStatistics.enviromentalData = currentEnviromentalData;
      });
  }

  returnAllOctoPrintVersions() {
    return this.#printersInformation.map((printer) => printer.octoPrintVersion);
  }

  async initFarmInformation() {
    this.#farmStats = await this.#farmStatisticsService.list({});
    if (!this.#farmStats || this.#farmStats.length < 1) {
      this.#farmStats[0] = await this.#farmStatisticsService.create(new Date(), this.#heatMap);
    } else if (!this.#farmStats[0]?.heatMap) {
      // TODO move to a service so it can be mocked - also: this is a one-time runner job to do between database versions
      this.#farmStats[0].heatMap = this.#heatMap;
      this.#dashboardStatistics.utilisationGraph = this.#heatMap;
      this.#farmStats[0].markModified("heatMap");
      await this.#farmStats[0].save();
    }
  }
}

module.exports = PrinterClean;
