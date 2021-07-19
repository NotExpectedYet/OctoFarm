const historyModel = require("../models/History");

class HistoryService {
  /**
   * Finds the history rows in the database.
   * @param {any} input
   */
  async find(input) {
    return historyModel.find(input, null, {
      sort: { historyIndex: -1 }
    });
  }

  /**
   * Get file specifications from a previous print job
   * @param history
   * @returns {{path: (*|string|null|string|string|string), uploadDate: (*|null), size: (*|null), lastPrintTime: (number|*|null), name, averagePrintTime: (number|*|null)}}
   */
  getFileFromHistoricJob(history) {
    const historyJob = history?.job;
    const historyJobFile = history?.job?.file;

    return {
      name: history.fileName,
      uploadDate: historyJobFile?.date || null,
      path: historyJobFile?.path || history.filePath, // TODO discuss this alternative
      size: historyJobFile?.size || null,
      averagePrintTime: historyJob?.averagePrintTime || null,
      lastPrintTime: historyJob?.lastPrintTime || null
    };
  }
}

module.exports = HistoryService;
