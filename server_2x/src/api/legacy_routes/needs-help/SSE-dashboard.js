// ==== DONE ===
// const express = require("express");
// const router = express.Router();
// const { ensureAuthenticated } = require("../../server/src/auth/config/auth");
// const { parse, stringify } = require("flatted/cjs");
// //Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
// let clientInformation = null;
// ==== END DONE ===

const printerClean = require("../../server/src/printers/lib/dataFunctions/printerClean.js");
const PrinterClean = printerClean.PrinterClean;

const settingsClean = require("../../server/src/printers/lib/dataFunctions/settingsClean.js");
const ClientSettings = settingsClean.SettingsClean;

// ==== DONE ===
// let clientId = 0;
// const clients = {}; // <- Keep a map of attached clients
// let interval = false;

// Called once for each new client. Note, this response is left open!
// router.get("/get/", ensureAuthenticated, function (req, res) {
//   //req.socket.setTimeout(Number.MAX_VALUE);
  // res.writeHead(200, {
  //   "Content-Type": "text/event-stream",
  //   "Cache-Control": "no-cache, no-store, must-revalidate",
  //   Pragma: "no-cache",
  //   Expires: 0,
  //   Connection: "keep-alive",
  // });
//   res.write("\n");
//   (function (clientId) {
//     clients[clientId] = res; // <- Add this client to those we consider "attached"
//     req.on("close", function () {
//       delete clients[clientId];
//     }); // <- Remove this client when he disconnects
//     req.on("error", function () {
//       delete clients[clientId];
//     }); // <- Remove this client when he disconnects
//   })(++clientId);
//   //console.log("Client: " + Object.keys(clients));
// });
// ==== END DONE ===

// ==== DONE ===
// if (interval === false) {
//   interval = setInterval(async function () {
// ==== END DONE ===
    const currentOperations = await PrinterClean.returnCurrentOperations();
    const dashStatistics = await PrinterClean.returnDashboardStatistics();
    const printerInformation = await PrinterClean.returnPrintersInformation();
// ==== DONE ===
//     let clientsSettings = await ClientSettings.returnClientSettings();
//     let dashboardSettings = null;
//     if (typeof clientSettings === "undefined") {
// ==== END DONE ===
      await ClientSettings.start();
// ==== DONE ===
//       clientsSettings = await ClientSettings.returnClientSettings();
//     }
//     if (typeof clientsSettings.dashboard === "undefined") {
//       dashboardSettings = {
//         defaultLayout: [
//           { x: 0, y: 0, width: 2, height: 5, id: "currentUtil" },
//           { x: 5, y: 0, width: 3, height: 5, id: "farmUtil" },
//           { x: 8, y: 0, width: 2, height: 5, id: "averageTimes" },
//           { x: 10, y: 0, width: 2, height: 5, id: "cumulativeTimes" },
//           { x: 2, y: 0, width: 3, height: 5, id: "currentStat" },
//           { x: 6, y: 5, width: 3, height: 5, id: "printerTemps" },
//           { x: 9, y: 5, width: 3, height: 5, id: "printerUtilisation" },
//           { x: 0, y: 5, width: 3, height: 5, id: "printerStatus" },
//           { x: 3, y: 5, width: 3, height: 5, id: "printerProgress" },
//           { x: 6, y: 10, width: 6, height: 9, id: "hourlyTemper" },
//           { x: 0, y: 10, width: 6, height: 9, id: "weeklyUtil" },
//           { x: 0, y: 19, width: 12, height: 8, id: "enviroData" },
//           {
//             x: 0,
//             y: 19,
//             width: 12,
//             height: 8,
//             id: "filamentUsageOverTime",
//           },
//           { x: 0, y: 19, width: 12, height: 8, id: "filamentUsageByDay" },
//           {
//             x: 0,
//             y: 19,
//             width: 12,
//             height: 8,
//             id: "historyCompletionByDay",
//           },
//         ],
//         savedLayout: [],
//         farmActivity: {
//           currentOperations: false,
//           cumulativeTimes: true,
//           averageTimes: true,
//         },
//         printerStates: {
//           printerState: true,
//           printerTemps: true,
//           printerUtilisation: true,
//           printerProgress: true,
//           currentStatus: true,
//         },
//         farmUtilisation: {
//           currentUtilisation: true,
//           farmUtilisation: true,
//         },
//         historical: {
//           weeklyUtilisation: true,
//           hourlyTotalTemperatures: false,
//           environmentalHistory: false,
//           filamentUsageOverTime: false,
//           filamentUsageByDay: false,
//           historyCompletionByDay: false,
//         },
//       };
//     } else {
//       dashboardSettings = clientsSettings.dashboard;
//     }
// const infoDrop = {
// ==== END DONE ===
      printerInformation,
      currentOperations: currentOperations,
      dashStatistics: dashStatistics,
// ==== DONE ===
//       dashboardSettings: dashboardSettings,
// };
//     clientInformation = await stringify(infoDrop);
//     for (clientId in clients) {
//       clients[clientId].write("retry:" + 10000 + "\n");
//       clients[clientId].write("data: " + clientInformation + "\n\n"); // <- Push a message to a single attached client
//     }
//   }, 5000);
// }
// module.exports = router;
// ==== END DONE ===
