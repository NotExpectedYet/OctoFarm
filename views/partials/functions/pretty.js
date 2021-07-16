const _ = require("lodash");

const bytes = function (a, b) {
  let string = "";
  if (a === undefined || isNaN(a) || a === null) {
    return (string = "No File Estimate");
  } else {
    if (0 == a) return "0 Bytes";
    const c = 1024,
      d = b || 2,
      e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
      f = Math.floor(Math.log(a) / Math.log(c));
    return parseFloat(a / Math.pow(c, f)).toFixed(d) + " " + e[f];
  }
};

const calculatePercent = function (use, total) {
  const percent = (use / total) * 100;
  return Math.round(percent);
};
const generateTime = function (seconds) {
  let string = "";
  if (seconds === undefined || isNaN(seconds) || seconds === null) {
    string = "No Time Estimate";
  } else {
    const days = Math.floor(seconds / (3600 * 24));

    seconds -= days * 3600 * 24;
    const hrs = Math.floor(seconds / 3600);

    seconds -= hrs * 3600;
    const mnts = Math.floor(seconds / 60);

    seconds -= mnts * 60;
    seconds = Math.floor(seconds);

    string = `${days}d, ${hrs}h, ${mnts}m, ${seconds}s`;

    if (mnts == 0) {
      if (string.includes("0m")) {
        string = string.replace(" 0m,", "");
      }
    }
    if (hrs == 0) {
      if (string.includes("0h")) {
        string = string.replace(" 0h,", "");
      }
    }
    if (days == 0) {
      if (string.includes("0d")) {
        string = string.replace("0d,", "");
      }
    }
    if (mnts == 0 && hrs == 0 && days == 0 && seconds == 0) {
      string = string.replace("0s", "Done");
    }
  }

  return string;
};
const historyTotals = function (history) {
  const historyFileNames = [];
  const historyPrinterNames = [];
  const historySpools = [];
  const paths = [];

  history.forEach((hist) => {
    historyPrinterNames.push(hist.printer.replace(/ /g, "_"));
    if (typeof hist.file !== "undefined") {
      historyFileNames.push(hist.file.name.replace(".gcode", ""));
      const path = hist.file.path.substring(0, hist.file.path.lastIndexOf("/"));
      if (path != "") {
        paths.push(path);
      }
    }
  });
  return {
    pathList: paths.filter(function (item, i, ar) {
      return ar.indexOf(item) === i;
    }),
    fileNames: historyFileNames.filter(function (item, i, ar) {
      return ar.indexOf(item) === i;
    }),
    printerNames: historyPrinterNames.filter(function (item, i, ar) {
      return ar.indexOf(item) === i;
    }),
    spools: historySpools.filter(function (item, i, ar) {
      return ar.indexOf(item) === i;
    })
  };
};

module.exports = {
  generateBytes: bytes,
  generateTime: generateTime,
  calculatePercent: calculatePercent,
  historyTotals: historyTotals
};
