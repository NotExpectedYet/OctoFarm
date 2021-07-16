const ALL_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

/**
 * Get an empty history statistics object (inflate to class when methods and meta is required!)
 * @returns {{storageRemain: number, storageUsed: number, averageLength: number, biggestLength: number, storageTotal: number, storagePercent: number, smallestLength: number, folderCount: number, fileCount: number, smallestFile: number, averageFile: number, biggestFile: number}}
 */
function getDefaultFileCleanStatistics() {
  return {
    storageUsed: 0,
    storageTotal: 0,
    storageRemain: 0,
    storagePercent: 0,
    fileCount: 0,
    folderCount: 0,
    biggestFile: 0,
    smallestFile: 0,
    biggestLength: 0,
    smallestLength: 0,
    averageFile: 0,
    averageLength: 0
  };
}

/**
 * Get a default dashboard statistics object (inflate to class when methods and meta is required!)
 * @returns {{printerHeatMaps: {}, currentPressure: null, timeEstimates: {}, farmUtilisation: {}, currentTemperature: null, currentUtilisation: {}, utilisationGraph: {}, currentStatus: {}, currentIAQ: null, currentHumidity: null, temperatureGraph: {}}}
 */
function getDefaultDashboardStatisticsObject() {
  return {
    currentUtilisation: {},
    currentStatus: {},
    timeEstimates: {},
    farmUtilisation: {},
    printerHeatMaps: {},
    utilisationGraph: {},
    temperatureGraph: {},
    currentIAQ: null,
    currentTemperature: null,
    currentPressure: null,
    currentHumidity: null
  };
}

const DEFAULT_SPOOL_DENSITY = 1.24;
const DEFAULT_SPOOL_RATIO = 1.75 / 2;
/**
 * Get an empty history statistics object (inflate to class when methods and meta is required!)
 * @returns {{currentFailed: number, totalPrinterCost: number, highestFilamentUsage: number, completed: number, failed: number, lowestFilamentUsage: number, printerLoad: number, totalFilamentUsage: number, totalSpoolCost: number, highestSpoolCost: number, longestPrintTime: number, printerMost: number, highestPrinterCost: number, shortestPrintTime: number, averageFilamentUsage: number, averagePrintTime: number, cancelled: number, mostPrintedFile: number}}
 */
function getDefaultHistoryStatistics() {
  return {
    completed: 0,
    cancelled: 0,
    failed: 0,
    longestPrintTime: 0,
    shortestPrintTime: 0,
    averagePrintTime: 0,
    mostPrintedFile: 0,
    printerMost: 0,
    printerLoad: 0,
    totalFilamentUsage: 0,
    averageFilamentUsage: 0,
    highestFilamentUsage: 0,
    lowestFilamentUsage: 0,
    totalSpoolCost: 0,
    highestSpoolCost: 0,
    totalPrinterCost: 0,
    highestPrinterCost: 0,
    currentFailed: 0
  };
}

/**
 * Get an empty heatmap object (inflate to class when methods and meta is required!)
 * @returns {({data: [], name: string}|{data: [], name: string}|{data: [], name: string}|{data: [], name: string}|{data: [], name: string})[]}
 */
function getEmptyHeatmap() {
  return [
    {
      name: "Completed",
      data: []
    },
    {
      name: "Active",
      data: []
    },
    {
      name: "Idle",
      data: []
    },
    {
      name: "Offline",
      data: []
    },
    {
      name: "Disconnected",
      data: []
    }
  ];
}

/**
 * Get an empty associative array with empty tool and bed temperature data objects
 * @returns {({data: [], name: string}|{data: [], name: string}|{data: [], name: string}|{data: [], name: string}|{data: [], name: string})[]}
 */
function getEmptyToolTemperatureArray() {
  return [
    {
      name: "Actual Tool",
      data: []
    },
    {
      name: "Target Tool",
      data: []
    },
    {
      name: "Actual Bed",
      data: []
    },
    {
      name: "Target Bed",
      data: []
    },
    {
      name: "Actual Chamber",
      data: []
    },
    {
      name: "Target Chamber",
      data: []
    }
  ];
}

function getEmptyOperationsObject() {
  return {
    operations: [],
    count: {
      printerCount: 0,
      complete: 0,
      offline: 0,
      active: 0,
      idle: 0,
      disconnected: 0,
      farmProgress: 0,
      farmProgressColour: "danger"
    }
  };
}

module.exports = {
  getDefaultFileCleanStatistics,
  getDefaultDashboardStatisticsObject,
  getDefaultHistoryStatistics,
  getEmptyHeatmap,
  getEmptyToolTemperatureArray,
  getEmptyOperationsObject,
  DEFAULT_SPOOL_DENSITY,
  DEFAULT_SPOOL_RATIO,
  ALL_MONTHS
};
