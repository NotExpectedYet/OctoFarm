const express = require("express");
const router = express.Router();
const { stringify } = require("flatted");
const { ensureAuthenticated } = require("../config/auth");
const { PrinterClean } = require("../lib/dataFunctions/printerClean.js");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean.js");
const {
  getDefaultDashboardSettings
} = require("../lib/providers/settings.constants");

// Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
let clientInformation = null;
let clientId = 0;
const clients = {}; // <- Keep a map of attached clients
let interval = false;

// Called once for each new client. Note, this response is left open!
router.get("/get/", ensureAuthenticated, function (req, res) {
  //req.socket.setTimeout(Number.MAX_VALUE);
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: 0,
    Connection: "keep-alive"
  });
  res.write("\n");
  (function (clientId) {
    clients[clientId] = res; // <- Add this client to those we consider "attached"
    req.on("close", function () {
      delete clients[clientId];
    }); // <- Remove this client when he disconnects
    req.on("error", function () {
      delete clients[clientId];
    }); // <- Remove this client when he errors out
  })(++clientId);
});

if (interval === false) {
  interval = setInterval(async function () {
    let clientsSettingsCache = await SettingsClean.returnClientSettings();
    if (!clientsSettingsCache) {
      await SettingsClean.start();
      clientsSettingsCache = await SettingsClean.returnClientSettings();
    }

    let dashboardSettings = clientsSettingsCache.dashboard;
    if (!dashboardSettings) {
      dashboardSettings = getDefaultDashboardSettings();
    }

    const currentOperations = await PrinterClean.returnCurrentOperations();
    const dashStatistics = await PrinterClean.returnDashboardStatistics();
    const printerInformation = await PrinterClean.listPrintersInformation();
    const infoDrop = {
      printerInformation,
      currentOperations,
      dashStatistics,
      dashboardSettings
    };

    clientInformation = await stringify(infoDrop);
    for (clientId in clients) {
      clients[clientId].write("retry:" + 10000 + "\n");
      clients[clientId].write("data: " + clientInformation + "\n\n"); // <- Push a message to a single attached client
    }
  }, 5000);
}

module.exports = router;
