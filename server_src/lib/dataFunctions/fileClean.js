"use strict";

const _ = require("lodash");
const Logger = require("../logger.js");
const { getPrintCostNumeric } = require("../utils/print-cost.util");

const {
  getDefaultFileCleanStatistics
} = require("../providers/cleaner.constants");

const logger = new Logger("OctoFarm-InformationCleaning");
const cleanFileList = [];
const fileStatistics = getDefaultFileCleanStatistics();

class FileClean {
  static returnFiles(p) {
    return cleanFileList[p];
  }

  static returnStatistics() {
    return fileStatistics;
  }

  static statistics(farmPrinters) {
    const storageFree = [];
    const storageTotal = [];
    const devices = [];
    const fileSizes = [];
    const fileLengths = [];
    const fileCount = [];
    const folderCount = [];

    // Collect unique devices - Total for farm storage should not duplicate storage on instances running on same devices.
    farmPrinters.forEach((printer, index) => {
      if (!!printer.storage) {
        const device = {
          ip: printer.printerURL,
          index: printer.index,
          storage: printer.storage
        };
        devices.push(device);
      }
      if (!!printer.fileList) {
        printer.fileList.files?.forEach((file) => {
          if (!isNaN(file.size)) {
            fileSizes.push(file.size);
          }
          if (!isNaN(file.length)) {
            fileLengths.push(file.length / 1000);
          }

          fileCount.push(file);
        });
        printer.fileList.folders?.forEach((file) => {
          folderCount.push(file);
        });
      }
    });

    const uniqueDevices = _.uniqBy(devices, "printerURL");
    uniqueDevices.forEach((device) => {
      storageFree.push(device.storage.free);
      storageTotal.push(device.storage.total);
    });

    const storageFreeTotal = storageFree.reduce((a, b) => a + b, 0);
    const storageTotalTotal = storageTotal.reduce((a, b) => a + b, 0);
    fileStatistics.storageUsed = storageTotalTotal - storageFreeTotal;
    fileStatistics.storageTotal = storageTotalTotal;
    fileStatistics.storageRemain = storageFreeTotal;
    fileStatistics.storagePercent =
      storageTotalTotal === 0
        ? 0
        : Math.floor((fileStatistics.storageUsed / storageTotalTotal) * 100);
    fileStatistics.fileCount = fileCount.length;
    fileStatistics.folderCount = folderCount.length;
    // TODO repeated calls?
    if (fileSizes.length !== 0) {
      fileStatistics.biggestFile = Math.max(...fileSizes);
      fileStatistics.smallestFile = Math.min(...fileSizes);
      fileStatistics.averageFile =
        fileSizes.reduce((a, b) => a + b, 0) / fileCount.length;
    }
    if (fileLengths.length !== 0) {
      fileStatistics.biggestLength = Math.max(...fileLengths);
      fileStatistics.smallestLength = Math.min(...fileLengths);
      fileStatistics.averageLength =
        fileLengths.reduce((a, b) => a + b, 0) / fileCount.length;
    }
  }

  static generate(farmPrinter, selectedFilament) {
    const { fileList, sortIndex } = farmPrinter;

    if (!fileList) {
      logger.error(
        "Printer File Cleaner failed: farmPrinter:fileList not defined."
      );
      return;
    }

    // NaN, object, undefined here
    if (Number.isNaN(sortIndex) || isNaN(sortIndex)) {
      logger.error(
        `Printer File Cleaner failed: farmPrinter:sortIndex is NaN (${sortIndex})`
      );
      return;
    }

    // null, string caught here
    if (!sortIndex && !Number.isInteger(sortIndex)) {
      logger.error(
        `Printer File Cleaner failed: farmPrinter:sortIndex not defined (${sortIndex})`
      );
      return;
    }

    if (sortIndex < 0) {
      logger.error(
        `File Cleaner failed: farmPrinter:sortIndex cannot be negative (${sortIndex})`
      );
      return;
    }

    if (!!farmPrinter.systemChecks) {
      farmPrinter.systemChecks.cleaning.file.status = "warning";
    }
    const printCost = farmPrinter.costSettings;
    const sortedFileList = [];
    if (!!fileList?.files) {
      for (let file of fileList.files) {
        const sortedFile = {
          path: file.path,
          fullPath: file.fullPath,
          display: file.display,
          name: file.name,
          uploadDate: file.date,
          fileSize: file.size,
          thumbnail: file.thumbnail,
          toolUnits: "",
          toolCosts: "",
          success: file.success,
          failed: file.failed,
          last: file.last,
          expectedPrintTime: file.time,
          printCost: getPrintCostNumeric(file.time, printCost)
        };
        sortedFile.toolUnits = FileClean.getUnits(
          selectedFilament,
          file.length
        );
        sortedFile.toolCosts = FileClean.getCost(
          selectedFilament,
          sortedFile.toolUnits
        );
        sortedFileList.push(sortedFile);
      }
    }

    // TODO oof not the sortIndex again... this is SUPER BUG PRONE
    // sortIndex should be a supporting math tool, not an array accessor
    cleanFileList[sortIndex] = {
      fileList: sortedFileList,
      filecount: fileList.fileCount || 0,
      folderList: fileList.folders || [],
      folderCount: fileList.folderCount || 0
    };
    if (!!farmPrinter.systemChecks) {
      farmPrinter.systemChecks.cleaning.file.status = "success";
      farmPrinter.systemChecks.cleaning.file.date = new Date();
    }
    logger.info("File Information cleaned and ready for consumption...");
  }

  /**
   * TODO get units of what? Be explicit.
   * @param filamentSelection
   * @param fileLength
   * @returns {*[]}
   */
  static getUnits(filamentSelection, fileLength) {
    const strings = [];
    const lengthArray = [];
    const weightArray = [];
    if (!!fileLength) {
      for (let l = 0; l < fileLength.length; l++) {
        const length = fileLength[l] / 1000;
        if (
          typeof filamentSelection !== "undefined" &&
          Array.isArray(filamentSelection)
        ) {
          if (filamentSelection[l] === null) {
            const radius = 1.75 / 2;
            const volume = length * Math.PI * radius * radius;
            const usage = volume * 1.24;
            lengthArray.push(length);
            weightArray.push(usage);
            strings.push(
              `<b>Tool ${l}:</b> ${length.toFixed(2)}m / ${usage.toFixed(2)}g`
            );
          } else if (typeof filamentSelection[l] !== "undefined") {
            const radius =
              parseFloat(filamentSelection[l].spools.profile.diameter) / 2;
            const volume = length * Math.PI * radius * radius;
            const usage =
              volume * parseFloat(filamentSelection[l].spools.profile.density);
            lengthArray.push(length);
            weightArray.push(usage);
            strings.push(
              `<b>Tool ${l}:</b> ${length.toFixed(2)}m / ${usage.toFixed(2)}g`
            );
          } else {
            lengthArray.push(0);
            weightArray.push(0);
            strings.push(`<b>Tool ${l}:</b> (No Spool)`);
          }
        } else {
          lengthArray.push(0);
          weightArray.push(0);
          strings.push(`<b>Tool ${l}:</b> (No Spool)`);
        }
      }

      const totalLength = lengthArray.reduce((a, b) => a + b, 0);
      const totalGrams = weightArray.reduce((a, b) => a + b, 0);
      const total = `<b>Total: </b>${totalLength.toFixed(
        2
      )}m / ${totalGrams.toFixed(2)}g`;
      strings.unshift(total);
      return strings;
    }
    return [];
  }

  /**
   * TODO get cost of what? Be explicit.
   * @param filamentSelection
   * @param units
   * @returns {*[]}
   */
  static getCost(filamentSelection, units) {
    units = JSON.parse(JSON.stringify(units));
    if (!Array.isArray(units) || units.length === 0) {
      return [];
    }

    const strings = [];
    const costArray = [];
    filamentSelection = JSON.parse(JSON.stringify(filamentSelection));
    filamentSelection.unshift("SKIP");
    for (let u = 0; u < units.length; u++) {
      if (
        typeof filamentSelection !== "undefined" &&
        Array.isArray(filamentSelection)
      ) {
        if (filamentSelection[u] === "SKIP") {
        } else if (
          typeof filamentSelection[u] !== "undefined" &&
          filamentSelection[u] !== null
        ) {
          let newUnit = units[u].split(" / ");
          newUnit = newUnit[1].replace("g", "");
          if (!units[u].includes("Total")) {
            const cost = (
              (filamentSelection[u].spools.price /
                filamentSelection[u].spools.weight) *
              parseFloat(newUnit)
            ).toFixed(2);
            costArray.push(parseFloat(cost));
            strings.push(cost);
          }
        } else {
          costArray.push(0);
          strings.push("(No Spool)");
        }
      } else {
        costArray.push(0);
        strings.push("(No Spool)");
      }
    }
    const totalCost = costArray.reduce((a, b) => a + b, 0);
    strings.unshift(totalCost.toFixed(2));
    return strings;
  }
}

module.exports = {
  FileClean
};
