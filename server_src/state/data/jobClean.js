"use strict";

const _ = require("lodash");
const { DateTime } = require("luxon");
const { getPrintCostNumeric } = require("../../utils/print-cost.util");
const { floatOrZero } = require("../../utils/number.util");

class JobClean {
  #cleanJobs = [];

  constructor() {}

  static getCompletionDate(printTimeLeftSeconds, completion) {
    if (completion === 100) {
      return "No Active Job";
    }

    const printDoneDT = DateTime.now().plus({ seconds: printTimeLeftSeconds });
    return printDoneDT.toFormat("ccc LLL dd yyyy: HH:mm");
  }

  getCleanJobAtIndex(p) {
    return this.#cleanJobs[p];
  }

  /**
   * Generate current job report
   * @param farmPrinter
   * @param selectedFilament
   * @returns {Promise<void>}
   */
  generate(farmPrinter, selectedFilament) {
    const printer = farmPrinter;

    if (!!farmPrinter.systemChecks) {
      farmPrinter.systemChecks.cleaning.job.status = "warning";
    }

    const currentJob = {
      progress: 0,
      fileName: "No File Selected",
      fileDisplay: "No File Selected",
      filePath: "No File Selected",
      expectedCompletionDate: null,
      expectedPrintTime: null,
      expectedFilamentCosts: null,
      expectedPrinterCosts: null,
      expectedTotals: null,
      currentZ: null,
      printTimeElapsed: null,
      printTimeRemaining: null,
      averagePrintTime: null,
      lastPrintTime: null,
      thumbnail: null
    };

    const printerJob = printer.job;
    if (!!printerJob) {
      currentJob.fileName = printerJob.file.name;
      const foundFile = _.find(printer.fileList.files, (o) => {
        return o.name == printerJob.file.name;
      });
      if (!!foundFile) {
        currentJob.thumbnail = foundFile.thumbnail;
      }
      currentJob.fileDisplay = printerJob.file.display;
      currentJob.filePath = printerJob.file.path;
      currentJob.averagePrintTime = printerJob.averagePrintTime;
      currentJob.lastPrintTime = printerJob.lastPrintTime;
      if (!!printer.currentZ) {
        currentJob.currentZ = printer.currentZ;
      }
      currentJob.expectedPrinterCosts = getPrintCostNumeric(
        printerJob.estimatedPrintTime,
        printer.costSettings
      )?.toFixed(2);
      // TODO selectedFilament should not be passed, instead the result of getSpool should be passed to this function as argument
      currentJob.expectedFilamentCosts = HistoryClean.getSpool(
        selectedFilament,
        printerJob,
        true,
        printerJob.estimatedPrintTime
      );

      let spoolCost = 0;
      let totalVolume = 0;
      let totalLength = 0;
      let totalWeight = 0;
      if (!!currentJob.expectedFilamentCosts) {
        const keys = Object.keys(currentJob.expectedFilamentCosts);
        for (let s = 0; s < currentJob.expectedFilamentCosts.length; s++) {
          const toolFilamentCosts = currentJob.expectedFilamentCosts[s][`tool${keys[s]}`];
          if (!!toolFilamentCosts) {
            spoolCost += floatOrZero(toolFilamentCosts.cost);
            totalVolume += floatOrZero(toolFilamentCosts.volume);
            totalLength += floatOrZero(toolFilamentCosts.length);
            totalWeight += floatOrZero(toolFilamentCosts.weight);
          }
        }
      }
      spoolCost = floatOrZero(spoolCost);
      currentJob.expectedTotals = {
        // TODO String a good idea?
        totalCost: (parseFloat(currentJob.expectedPrinterCosts) + spoolCost).toFixed(2),
        totalVolume,
        totalLength,
        totalWeight,
        spoolCost
      };
    }

    const printerProgress = printer.progress;
    if (!!printerProgress) {
      currentJob.progress = Math.floor(printerProgress.completion);
      currentJob.printTimeRemaining = printerProgress.printTimeLeft;
      currentJob.printTimeElapsed = printerProgress.printTime;
      currentJob.expectedPrintTime =
        Math.round((printerProgress.printTimeLeft + printerProgress.printTime) / 1000) * 1000;
      currentJob.expectedCompletionDate = JobClean.getCompletionDate(
        printerProgress.printTimeLeft,
        printerProgress.completion
      );
    }

    if (!!farmPrinter.systemChecks) {
      const systemCleaningJob = farmPrinter.systemChecks.cleaning.job;
      systemCleaningJob.status = "success";
      systemCleaningJob.date = new Date();
    }

    this.#cleanJobs[printer.sortIndex] = currentJob;
  }
}

module.exports = JobClean;
