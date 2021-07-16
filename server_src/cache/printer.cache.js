const { PrinterClean } = require("../lib/dataFunctions/printerClean");

let printerCleanState = new PrinterClean();

function getPrinterCache() {
  return printerCleanState;
}

function returnPrintersInformation() {
  return printerCleanState.printersInformation;
}

function returnPrinterControlList() {
  return printerCleanState.printerControlList;
}

function returnFilamentList() {
  return printerCleanState.printerFilamentList;
}

function returnCurrentOperations() {
  return printerCleanState.currentOperations;
}

function returnDashboardStatistics() {
  return printerCleanState.dashboardStatistics;
}

module.exports = {
  getPrinterCache,
  returnPrintersInformation,
  returnPrinterControlList,
  returnFilamentList,
  returnCurrentOperations,
  returnDashboardStatistics
};
