// ==== DONE ===
// const express = require("express");
// const router = express.Router();
// const {ensureAuthenticated} = require("../../server/src/auth/config/auth");
// const {stringify} = require("flatted/cjs");
// //Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
// let clientInformation = null;
// ==== END DONE ===

const printerClean = require("../../server/src/printers/lib/dataFunctions/printerClean.js");
const PrinterClean = printerClean.PrinterClean;
const printerTicker = require("../../server/src/printers/runners/printerTicker.js");
const {PrinterTicker} = printerTicker;

// ==== DONE ===
// let clientId = 0;
// const clients = {}; // <- Keep a map of attached clients
// let interval = false;
//
// // Called once for each new client. Note, this response is left open!
// router.get("/get/", ensureAuthenticated, function (req, res) {
//   //req.socket.setTimeout(Number.MAX_VALUE);
//   res.writeHead(200, {
//     "Content-Type": "text/event-stream",
//     "Cache-Control": "no-cache, no-store, must-revalidate",
//     Pragma: "no-cache",
//     Expires: 0,
//     Connection: "keep-alive",
//   });
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
//
//
// if (interval === false) {
//   interval = setInterval(async function () {
  // ==== END DONE ===
    const printersInformation = await PrinterClean.returnPrintersInformation();
    const printerControlList = await PrinterClean.returnPrinterControlList();
    const currentTickerList = await PrinterTicker.returnIssue();
// ==== DONE ===
//     const infoDrop = {
//       printersInformation: printersInformation,
//       printerControlList: printerControlList,
//       currentTickerList: currentTickerList,
//     };
//     clientInformation = await stringify(infoDrop);
//     for (clientId in clients) {
//       clients[clientId].write("retry:" + 10000 + "\n");
//       clients[clientId].write("data: " + clientInformation + "\n\n"); // <- Push a message to a single attached client
//     }
//   }, 500);
// }

// module.exports = router;
// ==== END DONE ===