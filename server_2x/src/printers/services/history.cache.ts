import { IHistoryCache } from "../interfaces/history-cache.interface";
import { HistoryCacheItemModel } from "../models/history-cache-item.model";
import { HistoryStatisticsModel } from "../models/history-statistics.model";
import { HistoryService } from "./history.service";
import {
  ALL_MONTHS,
  DEFAULT_SPOOL_DENSITY,
  DEFAULT_SPOOL_RATIO,
  getDefaultHistoryStatistics
} from "../printers.constants";
import { toTimeFormat } from "../utils/time.util";
import { stateToHtml } from "../utils/html.util";
import {
  arrayCounts,
  checkNested,
  checkNestedIndex
} from "../utils/array.util";
import { floatOrZero } from "../utils/number.util";
import { toDefinedKeyValue } from "../utils/property.util";
import { Injectable } from "@nestjs/common";
import { ServerSettingsCacheService } from "../../settings/services/server-settings-cache.service";
import { ServerSettings } from "../../settings/entities/server-settings.entity";
import {
  getPrintCostNumeric,
  noCostSettingsMessage
} from "../utils/print-cost.util";

@Injectable()
export class HistoryCache implements IHistoryCache {
  public history: HistoryCacheItemModel[];
  public statistics: HistoryStatisticsModel;

  private serverSettings: ServerSettings;

  constructor(
    private historyService: HistoryService,
    private serverSettingsCacheService: ServerSettingsCacheService
  ) {
    this.history = [];
    this.statistics = getDefaultHistoryStatistics();
  }

  /**
   * Calculate spool weight static (has nothing to do with cleaning state)
   * @param length
   * @param filament
   * @param completionRatio
   * @returns {string|*|number}
   */
  static calcSpoolWeightAsString(length, filament, completionRatio) {
    // TODO ... this is not a weight being returned at all?
    if (!length) {
      return length === 0 ? 0 : length;
    }

    let density = DEFAULT_SPOOL_DENSITY;
    let radius = DEFAULT_SPOOL_RATIO;
    // TODO improve illegality checks (if one is non-numeric, the weight becomes NaN)
    if (!!filament?.spools?.profile) {
      radius = parseFloat(filament.spools.profile.diameter) / 2;
      density = parseFloat(filament.spools.profile.density);
    }

    const volume = length * Math.PI * radius * radius; // Repeated 4x across server
    return (completionRatio * volume * density).toFixed(2);
  }

  static getSpoolLabel(id, filamentManagerEnabled: boolean) {
    const spool = id?.spools;
    if (!spool) {
      return null;
    }

    let spoolLeftoverConditional = "";
    if (filamentManagerEnabled) {
      const spoolWeight = (spool.weight - spool.used).toFixed(0);
      spoolLeftoverConditional = `(${spoolWeight}g)`;
    }
    return `${spool.name} ${spoolLeftoverConditional} - ${spool.profile?.material}`;
  }

  static getCostAsString(grams, spool, completionRatio) {
    if (!spool) {
      return null;
    }
    return (
      completionRatio *
      (spool.spools.price / spool.spools.weight) *
      grams
    ).toFixed(2);
  }

  static getJobAnalysis(job, printTime) {
    return !!job
      ? {
          actualPrintTime: printTime,
          estimatedPrintTime: job.estimatedPrintTime,
          printTimeAccuracy:
            ((printTime - job.estimatedPrintTime) / printTime) * 10000 // TODO can become NaN (2x)
        }
      : null;
  }

  /**
   * TODO needs cleanup or annotation
   * @param input
   * @returns {{x: Date, y: *}[]}
   */
  static sumValuesGroupByDate(input) {
    let dates = {};
    input.forEach((dv) => (dates[dv.x] = (dates[dv.x] || 0) + dv.y));
    return Object.keys(dates).map((date) => ({
      x: new Date(date),
      y: dates[date]
    }));
  }

  /**
   * Cumulative sum operator over numeric-only Y-values
   * @param input
   * @returns {[]}
   */
  static assignYCumSum(input) {
    let cumSum = 0;
    return input
      .filter((elem) => elem?.hasOwnProperty("x"))
      .map((elem) => ({
        x: elem?.x,
        y: (cumSum += elem?.y || 0)
      }));
  }

  static processHistorySpools(
    historyCleanEntry,
    usageOverTime,
    totalByDay,
    historyByDay
  ) {
    const spools = historyCleanEntry?.spools;
    const historyState = historyCleanEntry.state;

    const timestampDiffDaysAgo = 90 * 24 * 60 * 60 * 1000;
    let ninetyDaysAgo = new Date(Date.now() - timestampDiffDaysAgo);

    if (!!spools) {
      spools.forEach((spool) => {
        const keys = Object.keys(spool);
        for (const key of keys) {
          // Check if type exists
          let searchKeyword = "";
          let checkNestedResult = checkNested(spool[key].type, totalByDay);
          if (!!checkNestedResult) {
            // TODO state is being rechecked uselessly
            let checkNestedIndexHistoryRates = null;
            if (historyState.includes("success")) {
              searchKeyword = "Success";
            } else if (historyState.includes("warning")) {
              searchKeyword = "Cancelled";
            } else if (historyState.includes("danger")) {
              searchKeyword = "Failed";
            } else {
              // TODO why return? Not continue?
              return;
            }
            checkNestedIndexHistoryRates = checkNestedIndex(
              searchKeyword,
              historyByDay
            );

            let checkNestedIndexByDay = checkNestedIndex(
              spool[key].type,
              usageOverTime
            );
            let usageWeightCalc = historyCleanEntry.totalWeight;
            if (!!usageOverTime[checkNestedIndexByDay].data[0]) {
              usageWeightCalc =
                usageOverTime[checkNestedIndexByDay].data[
                  usageOverTime[checkNestedIndexByDay].data.length - 1
                ].y + historyCleanEntry.totalWeight;
            }

            let checkedIndex = checkNestedIndex(spool[key].type, totalByDay);
            let weightCalcSan = parseFloat(
              historyCleanEntry.totalWeight.toFixed(2)
            );

            // Don't include 0 weights
            if (weightCalcSan > 0) {
              let historyDate = historyCleanEntry.endDate;
              let dateSplit = historyDate.split(" ");
              let month = ALL_MONTHS.indexOf(dateSplit[1]);
              let dateString = `${parseInt(dateSplit[3])}-${
                month + 1
              }-${parseInt(dateSplit[2])}`;
              let dateParse = new Date(dateString);
              // Check if more than 90 days ago...
              if (dateParse.getTime() > ninetyDaysAgo.getTime()) {
                totalByDay[checkedIndex].data.push({
                  x: dateParse,
                  y: weightCalcSan
                });
                usageOverTime[checkedIndex].data.push({
                  x: dateParse,
                  y: weightCalcSan
                });
                historyByDay[checkNestedIndexHistoryRates].data.push({
                  x: dateParse,
                  y: 1
                });
              }
            }
          } else {
            if (spool[key].type !== "") {
              totalByDay.push({
                name: spool[key].type,
                data: []
              });
            }
            if (spool[key].type !== "") {
              usageOverTime.push({
                name: spool[key].type,
                data: []
              });
            }
            if (!historyByDay[0]) {
              historyByDay.push({
                name: "Success",
                data: []
              });
              historyByDay.push({
                name: "Failed",
                data: []
              });
              historyByDay.push({
                name: "Cancelled",
                data: []
              });
            }
          }
        }
      });
    }

    return {
      usageOverTime,
      totalByDay,
      historyByDay
    };
  }

  async initCache() {
    this.serverSettings =
      await this.serverSettingsCacheService.getServerSettings();

    const storedHistory = await this.historyService.find({});
    const historyEntities = storedHistory ?? [];
    if (!historyEntities?.length) {
      return;
    }

    const historyArray = [];
    for (let hist of historyEntities) {
      const printHistory = hist.printHistory;
      const printCost = getPrintCostNumeric(
        printHistory.printTime,
        printHistory.costSettings
      );
      const printSummary: HistoryCacheItemModel = {
        id: hist.id,
        index: printHistory.historyIndex,
        // TODO success: printHistory.success, // Proposal to avoid parsing html again
        state: stateToHtml(printHistory.success, printHistory?.reason),
        printer: printHistory.printerName,
        file: this.historyService.getFileFromHistoricJob(printHistory),
        startDate: printHistory.startDate,
        endDate: printHistory.endDate,
        printTime: printHistory.printTime,
        notes: printHistory.notes,
        printerCost: printCost?.toFixed(2) || noCostSettingsMessage,
        spools: this.getSpool(
          printHistory.filamentSelection,
          printHistory.job,
          printHistory.success,
          printHistory.printTime
        ),
        thumbnail: printHistory.thumbnail,
        job: HistoryCache.getJobAnalysis(
          printHistory.job,
          printHistory.printTime
        ),
        spoolCost: 0,
        totalVolume: 0,
        totalLength: 0,
        totalWeight: 0,
        ...toDefinedKeyValue(printHistory.resends, "resend"),
        ...toDefinedKeyValue(printHistory.snapshot, "snapshot"),
        ...toDefinedKeyValue(printHistory.timelapse, "timelapse")
      };

      if (!!printSummary.spools) {
        const keys = Object.keys(printSummary.spools);
        for (let s = 0; s < printSummary.spools.length; s++) {
          const toolProp = "tool" + keys[s];
          const spoolTool = printSummary.spools[s][toolProp];
          if (!!spoolTool) {
            printSummary.spoolCost += floatOrZero(spoolTool.cost);
            printSummary.totalVolume += floatOrZero(spoolTool.volume);
            printSummary.totalLength += floatOrZero(spoolTool.length);
            printSummary.totalWeight += floatOrZero(spoolTool.weight);
          }
        }
      }
      printSummary.totalCost = (printCost + printSummary.spoolCost).toFixed(2);
      printSummary.costPerHour = floatOrZero(
        parseFloat(printSummary.totalCost) /
          ((100 * parseFloat(printHistory.printTime)) / 360000)
      ).toFixed(2);

      printSummary.printHours = toTimeFormat(printHistory.printTime);
      historyArray.push(printSummary);
    }

    this.history = historyArray;
    this.statistics = this.generateStatistics();
  }

  generateStatistics(): HistoryStatisticsModel {
    let completedJobsCount = 0;
    let cancelledCount = 0;
    let failedCount = 0;
    const printTimes = [];
    const fileNames = [];
    const printerNames = [];
    const filamentWeight = [];
    const filamentLength = [];
    const printCost = [];
    const filamentCost = [];
    const failedPrintTime = [];

    const usageOverTime = [];
    const totalByDay = [];
    const historyByDay = [];

    for (let h = 0; h < this.history.length; h++) {
      const {
        printerCost,
        file,
        totalLength,
        state,
        printTime,
        printer,
        totalWeight,
        spoolCost
      } = this.history[h];

      if (state.includes("success")) {
        completedJobsCount++;
        printTimes.push(printTime);
        fileNames.push(file.name);
        printerNames.push(printer);
        filamentWeight.push(totalWeight);
        filamentLength.push(totalLength);
        printCost.push(parseFloat(printerCost));
      } else if (state.includes("warning")) {
        cancelledCount++;
        failedPrintTime.push(printTime);
      } else if (state.includes("danger")) {
        failedCount++;
        failedPrintTime.push(printTime);
      }
      filamentCost.push(spoolCost);

      HistoryCache.processHistorySpools(
        this.history[h],
        usageOverTime,
        totalByDay,
        historyByDay
      );
    }

    // TODO huge refactor #2
    const totalFilamentWeight = filamentWeight.reduce((a, b) => a + b, 0);
    const totalFilamentLength = filamentLength.reduce((a, b) => a + b, 0);
    const filesArray = arrayCounts(fileNames);
    let mostPrintedFile = "No Files";
    if (filesArray[0].length !== 0) {
      const countFilesArray = filesArray[1].indexOf(Math.max(...filesArray[1]));
      mostPrintedFile = filesArray[0][countFilesArray];
      mostPrintedFile = mostPrintedFile.replace(/_/g, " ");
    }
    const printerNamesArray = arrayCounts(printerNames);
    let mostUsedPrinter = "No Printers";
    let leastUsedPrinter = "No Printers";
    if (printerNamesArray[0].length !== 0) {
      const maxIndexPrinterNames = printerNamesArray[1].indexOf(
        Math.max(...printerNamesArray[1])
      );
      const minIndexPrinterNames = printerNamesArray[1].indexOf(
        Math.min(...printerNamesArray[1])
      );
      mostUsedPrinter = printerNamesArray[0][maxIndexPrinterNames];
      leastUsedPrinter = printerNamesArray[0][minIndexPrinterNames];
    }
    const statTotal = completedJobsCount + cancelledCount + failedCount;
    totalByDay.forEach((usage) => {
      usage.data = HistoryCache.sumValuesGroupByDate(usage.data);
    });
    usageOverTime.forEach((usage) => {
      usage.data = HistoryCache.sumValuesGroupByDate(usage.data);
    });
    usageOverTime.forEach((usage) => {
      usage.data = HistoryCache.assignYCumSum(usage.data);
    });
    historyByDay.forEach((usage) => {
      usage.data = HistoryCache.sumValuesGroupByDate(usage.data);
    });

    return {
      completed: completedJobsCount,
      cancelled: cancelledCount,
      failed: failedCount,
      completedPercent: ((completedJobsCount / statTotal) * 100).toFixed(2),
      cancelledPercent: ((cancelledCount / statTotal) * 100).toFixed(2),
      failedPercent: ((failedCount / statTotal) * 100).toFixed(2),
      longestPrintTime: Math.max(...printTimes).toFixed(2),
      shortestPrintTime: Math.min(...printTimes).toFixed(2),
      averagePrintTime: (
        printTimes.reduce((a, b) => a + b, 0) / printTimes.length
      ).toFixed(2),
      mostPrintedFile,
      printerMost: mostUsedPrinter,
      printerLoad: leastUsedPrinter,
      totalFilamentUsage:
        totalFilamentWeight.toFixed(2) +
        "g / " +
        totalFilamentLength.toFixed(2) +
        "m",
      averageFilamentUsage:
        (totalFilamentWeight / filamentWeight.length).toFixed(2) +
        "g / " +
        (totalFilamentLength / filamentLength.length).toFixed(2) +
        "m",
      highestFilamentUsage:
        Math.max(...filamentWeight).toFixed(2) +
        "g / " +
        Math.max(...filamentLength).toFixed(2) +
        "m",
      lowestFilamentUsage:
        Math.min(...filamentWeight).toFixed(2) +
        "g / " +
        Math.min(...filamentLength).toFixed(2) +
        "m",
      totalSpoolCost: filamentCost.reduce((a, b) => a + b, 0).toFixed(2),
      highestSpoolCost: Math.max(...filamentCost).toFixed(2),
      totalPrinterCost: printCost.reduce((a, b) => a + b, 0).toFixed(2),
      highestPrinterCost: Math.max(...printCost).toFixed(2),
      currentFailed: failedPrintTime.reduce((a, b) => a + b, 0),
      totalByDay: totalByDay,
      usageOverTime,
      historyByDay: historyByDay
    };
  }

  /**
   * Util, could be moved
   * @param filamentSelection
   * @param job
   * @param success
   * @param time
   */
  public getSpool(filamentSelection, job, success, time) {
    // Fix for old database states
    if (!job?.filament) {
      return null;
    }

    let printPercentage = 0;
    if (!success) {
      // TODO what if estimatedPrintTime is falsy? Should become partial result.
      printPercentage = (time / job.estimatedPrintTime) * 100;
    }
    // TODO ehm?
    job = job.filament;

    const spools = [];
    for (const key of Object.keys(job)) {
      const keyIndex = Object.keys(job).indexOf(key);
      const filamentEntry = Array.isArray(filamentSelection)
        ? filamentSelection[keyIndex]
        : filamentSelection;
      const metric = job[key];
      let completionRatio = success ? 1.0 : printPercentage / 100;

      const spoolWeight = HistoryCache.calcSpoolWeightAsString(
        metric.length / 1000,
        filamentEntry,
        completionRatio
      );
      const spoolName = HistoryCache.getSpoolLabel(
        filamentEntry,
        this.serverSettings.filamentManager
      );
      spools.push({
        [key]: {
          toolName: "Tool " + key.substring(4, 5),
          spoolName,
          spoolId: filamentEntry?._id || null, // TODO discuss fallback null or undefined
          volume: (completionRatio * metric.volume).toFixed(2),
          length: ((completionRatio * metric.length) / 1000).toFixed(2),
          weight: spoolWeight,
          cost: HistoryCache.getCostAsString(
            spoolWeight,
            filamentEntry,
            completionRatio
          ),
          type: filamentEntry?.spools?.profile?.material || ""
        }
      });
    }
    return spools;
  }
}
