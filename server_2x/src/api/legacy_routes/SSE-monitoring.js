const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../../server/src/auth/config/auth");
const { parse, stringify } = require("flatted/cjs");
const _ = require("lodash");
const Logger = require("../../server/src/printers/lib/logger.js");

const logger = new Logger("OctoFarm-API");
//Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
let clientInformation = null;

const printerClean = require("../../server/src/printers/lib/dataFunctions/printerClean.js");
const PrinterClean = printerClean.PrinterClean;
const settingsClean = require("../../server/src/printers/lib/dataFunctions/settingsClean.js");
const SettingsClean = settingsClean.SettingsClean;
const { getSorting, getFilter } = require("../../server/src/printers/lib/sorting.js");
const { writePoints } = require("../../server/src/printers/lib/influxExport.js");
// User Modal
const runner = require("../../server/src/printers/runners/state.js");
const Runner = runner.Runner;

let clients = [];
let interval = false;
let influxCounter = 2000;

const sortMe = function (printers) {
  let sortBy = getSorting();
  if (sortBy === "index") {
    return printers;
  } else if (sortBy === "percent") {
    let sortedPrinters = printers.sort(function (a, b) {
      if (typeof a.currentJob === "undefined") return 1;
      if (typeof b.currentJob === "undefined") return -1;
      return (
        parseFloat(a.currentJob.percent) - parseFloat(b.currentJob.percent)
      );
    });
    let i = 0,
      len = sortedPrinters.length;
    while (i + 1 < len + 1) {
      sortedPrinters[i].order = i;
      i++;
    }
    return sortedPrinters;
  } else if (sortBy === "time") {
    let sortedPrinters = printers.sort(function (a, b) {
      if (typeof a.currentJob === "undefined") return 1;
      if (typeof b.currentJob === "undefined") return -1;
      return (
        parseFloat(a.currentJob.printTimeRemaining) -
        parseFloat(b.currentJob.printTimeRemaining)
      );
    });
    let i = 0,
      len = sortedPrinters.length;
    while (i + 1 < len + 1) {
      sortedPrinters[i].order = i;
      i++;
    }
    return sortedPrinters;
  } else {
    return printers;
  }
};
const filterMe = function (printers) {
  let filterBy = getFilter();
  let currentGroups = Runner.returnGroupList();
  if (filterBy === "All Printers") {
    return printers;
  } else if (filterBy === "State: Active") {
    let i = 0,
      len = printers.length;
    while (i < len) {
      printers[i].display =
        printers[i].printerState.colour.category === "Active";
      i++;
    }
    return printers;
  } else if (filterBy === "State: Idle") {
    let i = 0,
      len = printers.length;
    while (i < len) {
      printers[i].display = printers[i].printerState.colour.category === "Idle";
      i++;
    }
    return printers;
  } else if (filterBy === "State: Disconnected") {
    let i = 0,
      len = printers.length;
    while (i < len) {
      printers[i].display =
        printers[i].printerState.colour.category === "Disconnected";
      i++;
    }
    return printers;
  } else if (filterBy === "State: Complete") {
    let i = 0,
      len = printers.length;
    while (i < len) {
      printers[i].display =
        printers[i].printerState.colour.category === "Complete";
      i++;
    }
    return printers;
  } else {
    //Check groups...
    let current = null;
    for (let i = 0; i < currentGroups.length; i++) {
      if (filterBy === currentGroups[i]) {
        current = currentGroups[i];
      }
    }
    if (current !== null) {
      let i = 0,
        len = printers.length;
      while (i < len) {
        printers[i].display =
          printers[i].group === current.replace("Group: ", "");
        i++;
      }
      return printers;
    } else {
      //Fall back...
      return printers;
    }
  }
};
if (interval === false) {
  interval = setInterval(async function () {
    const currentOperations = await PrinterClean.returnCurrentOperations();

    let printersInformation = await PrinterClean.returnPrintersInformation();

    printersInformation = await filterMe(printersInformation);
    printersInformation = await sortMe(printersInformation);
    const printerControlList = await PrinterClean.returnPrinterControlList();
    let clientSettings = await SettingsClean.returnClientSettings();
    if (typeof clientSettings === "undefined") {
      await SettingsClean.start();
      clientSettings = await SettingsClean.returnClientSettings();
    }

    let serverSettings = await SettingsClean.returnSystemSettings();
    if (typeof serverSettings === "undefined") {
      await SettingsClean.start();
      serverSettings = await SettingsClean.returnSystemSettings();
    }
    if (serverSettings.influxExport.active) {
      if (influxCounter >= 2000) {
        sendToInflux(printersInformation);
        influxCounter = 0;
      } else {
        influxCounter = influxCounter + 500;
      }
      // eslint-disable-next-line no-use-before-define
    }
    const infoDrop = {
      printersInformation: printersInformation,
      currentOperations: currentOperations,
      printerControlList: printerControlList,
      clientSettings: clientSettings,
    };
    clientInformation = await stringify(infoDrop);
    clients.forEach((c, index) => {
      c.res.write("data: " + clientInformation + "\n\n");
    });
  }, 500);
}

// Called once for each new client. Note, this response is left open!
router.get("/get/", ensureAuthenticated, function (req, res) {
  // Mandatory headers and http status to keep connection open
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: 0,
    Connection: "keep-alive",
  };
  res.writeHead(200, headers);
  // After client opens connection send all nests as string
  const data = "data: " + clientInformation + "\n\n";
  res.write(data);
  // Generate an id based on timestamp and save res
  // object of client connection on clients list
  // Later we'll iterate it and send updates to each client
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };
  clients.push(newClient);
  logger.info(`${clientId} Connection opened`);
  // When client closes connection we update the clients list
  // avoiding the disconnected one
  req.on("close", () => {
    logger.info(`${clientId} Connection closed`);
    clients = clients.filter((c) => c.id !== clientId);
  });
});

function sendToInflux(printersInformation) {
  //console.log(printersInformation[0]);
  printersInformation.forEach((printer) => {
    const date = Date.now();
    let group = " ";
    if (printer.group === "") {
      group = " ";
    } else {
      group = printer.group;
    }

    const tags = {
      name: printer.printerName,
      group: group,
      url: printer.printerURL,
      state: printer.printerState.state,
      stateCategory: printer.printerState.colour.category,
      host_state: printer.hostState.state,
      websocket_state: printer.webSocketState.colour,
      octoprint_version: printer.octoPrintVersion,
    };
    const printerData = {
      name: printer.printerName,
      group: group,
      url: printer.printerURL,
      state: printer.printerState.state,
      host_state: printer.hostState.state,
      websocket_state: printer.webSocketState.colour,
      octoprint_version: printer.octoPrintVersion,
      group: group,
      state_category: printer.printerState.colour.category,
      current_idle_time: parseFloat(printer.currentIdle),
      current_active_time: parseFloat(printer.currentActive),
      current_offline_time: parseFloat(printer.currentOffline),
      date_added: parseFloat(printer.dateAdded),
      storage_free: parseFloat(printer.storage.free),
      storage_total: parseFloat(printer.storage.total),
      timestamp: date,
    };
    if (typeof printer.resends !== "undefined") {
      printerData["job_resends"] = `${printer.resends.count} / ${
        printer.resends.transmitted / 1000
      }K (${printer.resends.ratio.toFixed(0)}`;
    }

    if (
      typeof printer.currentJob !== "undefined" &&
      printer.currentJob !== null
    ) {
      for (const key in printer.currentJob) {
        if (printer.currentJob.hasOwnProperty(key)) {
          if (key === "progress" && printer.currentJob[key] !== null) {
            printerData["job_progress"] = parseFloat(printer.currentJob[key]);
          }
          if (key === "fileName" && printer.currentJob[key] !== null) {
            printerData["job_file_name"] = printer.currentJob[key];
          }
          if (key === "fileDisplay" && printer.currentJob[key] !== null) {
            printerData["job_file_display"] = printer.currentJob[key];
          }
          if (key === "filePath" && printer.currentJob[key] !== null) {
            printerData["job_file_path"] = printer.currentJob[key];
          }
          if (
            key === "expectedCompletionDate" &&
            printer.currentJob[key] !== null
          ) {
            printerData["job_expected_completion_date"] =
              printer.currentJob[key];
          }
          if (key === "expectedPrintTime" && printer.currentJob[key] !== null) {
            printerData["job_expected_print_time"] = parseFloat(
              printer.currentJob[key]
            );
          }
          if (
            key === "expectedFilamentCosts" &&
            printer.currentJob[key] !== null
          ) {
          }
          if (
            key === "expectedPrinterCosts" &&
            printer.currentJob[key] !== null
          ) {
            printerData["job_expected_print_cost"] = parseFloat(
              printer.currentJob[key]
            );
          }
          if (key === "expectedTotals" && printer.currentJob[key] !== null) {
          }
          if (key === "currentZ" && printer.currentJob[key] !== null) {
            printerData["job_current_z"] = parseFloat(printer.currentJob[key]);
          }
          if (key === "printTimeElapsed" && printer.currentJob[key] !== null) {
            printerData["job_print_time_elapsed"] = parseFloat(
              printer.currentJob[key]
            );
          }
          if (
            key === "printTimeRemaining" &&
            printer.currentJob[key] !== null
          ) {
            printerData["job_print_time_remaining"] = parseFloat(
              printer.currentJob[key]
            );
          }
          if (key === "averagePrintTime" && printer.currentJob[key] !== null) {
            printerData["job_average_print_time"] = parseFloat(
              printer.currentJob[key]
            );
          }
          if (key === "lastPrintTime" && printer.currentJob[key] !== null) {
            printerData["job_last_print_time"] = parseFloat(
              printer.currentJob[key]
            );
          }
          if (key === "thumbnail" && printer.currentJob[key] !== null) {
            printerData["job_thumbnail"] = printer.currentJob[key];
          }
        }
      }
    }

    if (printer.selectedFilament.length >= 1) {
      printer.selectedFilament.forEach((spool, index) => {
        if (spool !== null) {
          printerData[`tool_${index}_spool_name`] = spool.spools.name;
          printerData[`tool_${index}_spool_used`] = parseFloat(
            spool.spools.used
          );
          printerData[`tool_${index}_spool_weight`] = parseFloat(
            spool.spools.weight
          );
          printerData[`tool_${index}_spool_temp_offset`] = parseFloat(
            spool.spools.tempOffset
          );
          if (typeof spool.spools.material !== "undefined") {
            printerData[`tool_${index}_spool_material`] = spool.spools.material;
          }
        }
      });
    }

    if (
      typeof printer.tools !== "undefined" &&
      printer.tools !== null &&
      printer.tools[0] !== null
    ) {
      for (const key in printer.tools[0]) {
        if (printer.tools[0].hasOwnProperty(key)) {
          if (key !== "time") {
            if (printer.tools[0][key].actual !== null) {
              printerData[key + "_actual"] = parseFloat(
                printer.tools[0][key].actual
              );
            } else {
              printerData[key + "_actual"] = 0;
            }
            if (printer.tools[0][key].target !== null) {
              printerData[key + "_target"] = parseFloat(
                printer.tools[0][key].target
              );
            } else {
              printerData[key + "_target"] = 0;
            }
          }
        }
      }
    }
    writePoints(tags, "PrintersInformation", printerData);
  });
}

module.exports = router;
