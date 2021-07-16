"use strict";

const _ = require("lodash");
const EventEmitter = require("events");
const WebSocket = require("ws");
const Logger = require("../lib/logger.js");

const Profiles = require("../models/Profiles.js");
const Printers = require("../models/Printer.js");
const Filament = require("../models/Filament.js");
const TempHistory = require("../models/TempHistory.js");
const { convertHttpUrlToWebsocket } = require("../utils/url.utils");
const softwareUpdateChecker = require("../services/octofarm-update.service");

const {
  OctoprintApiClientService
} = require("../services/octoprint/octoprint-api-client.service");
const { HistoryCollection } = require("./history.runner.js");
const {
  ServerSettings,
  filamentManager
} = require("../settings/serverSettings.js");
const { ScriptRunner } = require("./scriptCheck.js");
const { PrinterClean } = require("../lib/dataFunctions/printerClean.js");
const { JobClean } = require("../lib/dataFunctions/jobClean.js");
const { FileClean } = require("../lib/dataFunctions/fileClean.js");
const { FilamentClean } = require("../lib/dataFunctions/filamentClean.js");
const { PrinterTicker } = require("./printerTicker.js");

const logger = new Logger("OctoFarm-State");
let farmPrinters = [];
let farmPrintersGroups = [];
let systemSettings = {};

const printersInformation = false;
let timeout = null;
if (printersInformation === false) {
  setInterval(async () => {
    for (let index = 0; index < farmPrinters.length; index++) {
      if (typeof farmPrinters[index] !== "undefined") {
        PrinterClean.generate(
          farmPrinters[index],
          systemSettings.filamentManager
        );
      }
    }
  }, 20000);
  setTimeout(async () => {
    for (let index = 0; index < farmPrinters.length; index++) {
      if (typeof farmPrinters[index] !== "undefined") {
        PrinterClean.generate(
          farmPrinters[index],
          systemSettings.filamentManager
        );
      }
    }
  }, 10000);
}

function WebSocketClient() {
  this.number = 0; // Message number
  this.autoReconnectInterval = timeout.webSocketRetry; // ms
}

function noop() {}

function heartBeat(index) {
  if (farmPrinters[index].state === "Disconnected") {
    farmPrinters[index].webSocket = "warning";
    farmPrinters[index].webSocketDescription =
      "Websocket Connected but in Tentative state until receiving data";
  } else {
    farmPrinters[index].webSocket = "success";
    farmPrinters[index].webSocketDescription = "Websocket Connection Online";
  }
  PrinterTicker.addIssue(
    new Date(),
    farmPrinters[index].printerURL,
    "Pong message received from client...",
    "Complete",
    farmPrinters[index]._id
  );
  farmPrinters[index].ws.isAlive = true;
}

const heartBeatInterval = setInterval(function ping() {
  farmPrinters.forEach(function each(client) {
    if (
      typeof client.ws !== "undefined" &&
      typeof client.ws.isAlive !== "undefined"
    ) {
      if (
        client.ws.instance.readyState !== 0 &&
        client.ws.instance.readyState !== 2 &&
        client.ws.instance.readyState !== 3
      ) {
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[client.ws.index].printerURL,
          "Sending ping message to websocket...",
          "Active",
          farmPrinters[client.ws.index]._id
        );
        if (client.ws.isAlive === false) return client.ws.instance.terminate();

        // Retry connecting if failed...
        farmPrinters[client.ws.index].webSocket = "info";
        farmPrinters[client.ws.index].webSocketDescription =
          "Checking if Websocket is still alive";
        client.ws.isAlive = false;
        client.ws.instance.ping(noop);
      }
    }
  });
}, 300000);

WebSocketClient.prototype.open = function (url, index) {
  try {
    this.url = url;
    this.index = index;
    PrinterTicker.addIssue(
      new Date(),
      farmPrinters[this.index].printerURL,
      "Setting up the clients websocket connection",
      "Active",
      farmPrinters[this.index]._id
    );
    farmPrinters[this.index].webSocket = "warning";
    farmPrinters[this.index].webSocketDescription =
      "Websocket Connected but in Tentative state until receiving data";
    this.instance = new WebSocket(this.url, { followRedirects: true });
    this.instance.on("open", () => {
      this.isAlive = true;
      try {
        this.onopen(this.index);
      } catch (e) {
        logger.info(
          `Cannot re-open web socket... : ${this.index}: ${this.url}`
        );
        this.instance.emit("error", e);
      }
    });
    this.instance.on("pong", () => {
      heartBeat(this.index);
    });
    this.instance.on("message", (data, flags) => {
      this.number++;
      try {
        this.onmessage(data, flags, this.number, this.index);
      } catch (e) {
        logger.info(
          e,
          "There was an issue opening the websocket... hard fail..."
        );
        this.instance.emit("error", e);
      }
    });
    this.instance.on("close", (e) => {
      switch (e) {
        case 1000: // CLOSE_NORMAL
          logger.info(`WebSocket: closed: ${this.index}: ${this.url}`);
          try {
            farmPrinters[this.index].state = "Offline";
            farmPrinters[this.index].stateColour = Runner.getColour("Offline");
            farmPrinters[this.index].hostState = "Shutdown";
            farmPrinters[this.index].hostStateColour =
              Runner.getColour("Shutdown");
            farmPrinters[this.index].webSocket = "danger";
            farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
            farmPrinters[this.index].hostDescription = "Host is Shutdown";
            farmPrinters[this.index].webSocketDescription =
              "Websocket Closed by OctoFarm";
            this.instance.removeAllListeners();
            if (typeof farmPrinters[this.index] !== "undefined") {
              PrinterClean.generate(
                farmPrinters[this.index],
                systemSettings.filamentManager
              );
            }
          } catch (e) {
            logger.info(
              `Couldn't set state of missing printer, safe to ignore: ${this.index}: ${this.url}`
            );
          }
          break;
        case 1005: // CLOSE_NORMAL
          logger.info(`WebSocket: closed: ${this.index}: ${this.url}`);
          try {
            farmPrinters[this.index].state = "Offline";
            farmPrinters[this.index].stateColour = Runner.getColour("Offline");
            farmPrinters[this.index].hostState = "Shutdown";
            farmPrinters[this.index].hostStateColour =
              Runner.getColour("Shutdown");
            farmPrinters[this.index].webSocket = "danger";
            farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
            farmPrinters[this.index].hostDescription = "Host is Shutdown";
            farmPrinters[this.index].webSocketDescription =
              "Websocket Closed by OctoFarm";
            this.instance.removeAllListeners();
            if (typeof farmPrinters[this.index] !== "undefined") {
              PrinterClean.generate(
                farmPrinters[this.index],
                systemSettings.filamentManager
              );
            }
          } catch (e) {
            logger.info(
              `Couldn't set state of missing printer, safe to ignore: ${this.index}: ${this.url}`
            );
          }
          break;
        case 1006: // TERMINATE();
          try {
            farmPrinters[this.index].state = "Offline";
            farmPrinters[this.index].stateColour = Runner.getColour("Offline");
            farmPrinters[this.index].hostState = "Shutdown";
            farmPrinters[this.index].hostStateColour =
              Runner.getColour("Shutdown");
            farmPrinters[this.index].webSocket = "danger";
            farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
            farmPrinters[this.index].hostDescription = "Host is Shutdown";
            farmPrinters[this.index].webSocketDescription =
              "Websocket Terminated by OctoFarm, Ping/Pong check fails";
            this.instance.removeAllListeners();
            if (typeof farmPrinters[this.index] !== "undefined") {
              PrinterClean.generate(
                farmPrinters[this.index],
                systemSettings.filamentManager
              );
            }
          } catch (e) {
            logger.info(
              `Ping/Pong failed to get a response, closing and attempted to reconnect: ${this.index}: ${this.url}`
            );
          }
          PrinterTicker.addIssue(
            new Date(),
            farmPrinters[this.index].printerURL,
            "Client error, setting back up... in 10000ms",
            "Offline",
            farmPrinters[this.index]._id
          );
          setTimeout(async () => {
            Runner.reScanOcto(farmPrinters[this.index]._id);
            logger.info("Error with websockets... resetting up!");
          }, 10000);
          break;
        default:
          console.log("ON CLOSE");
      }

      return "closed";
    });
    this.instance.on("error", (e) => {
      switch (e.code) {
        case "ECONNREFUSED":
          logger.error(JSON.stringify(e), `${this.index}: ${this.url}`);
          try {
            farmPrinters[this.index].state = "Offline";
            farmPrinters[this.index].stateColour = Runner.getColour("Offline");
            farmPrinters[this.index].hostState = "Connection Refused";
            farmPrinters[this.index].hostStateColour =
              Runner.getColour("Online");
            farmPrinters[this.index].webSocket = "danger";
            farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
            farmPrinters[this.index].hostDescription = "Host is Shutdown";
            farmPrinters[this.index].webSocketDescription =
              "Websocket Connection was refused by host";
          } catch (e) {
            logger.info(
              `Couldn't set state of missing printer, safe to ignore: ${this.index}: ${this.url}`
            );
          }
          this.reconnect(e);
          break;
        case "ECONNRESET":
          logger.error(JSON.stringify(e), `${this.index}: ${this.url}`);
          try {
            farmPrinters[this.index].state = "Offline";
            farmPrinters[this.index].stateColour = Runner.getColour("Offline");
            farmPrinters[this.index].hostState = "Connection Reset";
            farmPrinters[this.index].hostStateColour =
              Runner.getColour("Shutdown");
            farmPrinters[this.index].webSocket = "danger";
            farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
            farmPrinters[this.index].hostDescription = "Host is Offline";
            farmPrinters[this.index].webSocketDescription =
              "Websocket Connection was reset by host";
          } catch (e) {
            logger.info(
              `Couldn't set state of missing printer, safe to ignore: ${this.index}: ${this.url}`
            );
          }
          this.reconnect(e);
          break;
        case "EHOSTUNREACH":
          logger.error(JSON.stringify(e), `${this.index}: ${this.url}`);
          try {
            farmPrinters[this.index].state = "Offline";
            farmPrinters[this.index].stateColour = Runner.getColour("Offline");
            farmPrinters[this.index].hostState = "Host Unreachable";
            farmPrinters[this.index].hostStateColour =
              Runner.getColour("Shutdown");
            farmPrinters[this.index].webSocket = "danger";
            farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
            farmPrinters[this.index].hostDescription = "Host is Shutdown";
            farmPrinters[this.index].webSocketDescription =
              "Host is unreachable cannot establish connection";
          } catch (e) {
            logger.info(
              `Couldn't set state of missing printer, safe to ignore: ${this.index}: ${this.url}`
            );
          }
          this.reconnect(e);
          break;
        case "ENOTFOUND":
          logger.error(JSON.stringify(e), `${this.index}: ${this.url}`);
          try {
            farmPrinters[this.index].state = "Offline";
            farmPrinters[this.index].stateColour = Runner.getColour("Offline");
            farmPrinters[this.index].hostState = "Host not found";
            farmPrinters[this.index].hostStateColour =
              Runner.getColour("Shutdown");
            farmPrinters[this.index].webSocket = "danger";
            farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
            farmPrinters[this.index].hostDescription =
              "Cannot find host on network, is you address correct?";
            farmPrinters[this.index].webSocketDescription =
              "Host is unreachable cannot establish connection....";
          } catch (e) {
            logger.info(
              `Couldn't set state of missing printer, safe to ignore: ${this.index}: ${this.url}`
            );
          }
          this.reconnect(e);
          break;
        default:
          logger.error(JSON.stringify(e), `${this.index}: ${this.url}`);
          try {
            farmPrinters[this.index].state = "Re-Sync";
            farmPrinters[this.index].stateColour = Runner.getColour("Offline");
            farmPrinters[this.index].hostState = "Error!";
            farmPrinters[this.index].hostStateColour =
              Runner.getColour("Offline");
            farmPrinters[this.index].webSocket = "danger";
            farmPrinters[this.index].stateDescription =
              "Hard Failure, please Re-Sync when Online";
            farmPrinters[this.index].hostDescription =
              "Hard Failure, please Re-Sync when Online";
            farmPrinters[this.index].webSocketDescription =
              "Hard Failure, please Re-Sync when Online";
            this.instance.removeAllListeners();

            if (typeof farmPrinters[this.index] !== "undefined") {
              PrinterClean.generate(
                farmPrinters[this.index],
                systemSettings.filamentManager
              );
            }
          } catch (e) {
            logger.info(
              `Couldn't set state of missing printer, safe to ignore: ${this.index}: ${this.url}`
            );
          }
          logger.error(`WebSocket hard failure: ${this.index}: ${this.url}`);
          // Auto connect here is causing double socket listeners when editing
          //this.reconnect(e);
          break;
      }
    });
    return true;
  } catch (e) {
    logger.info(
      JSON.stringify(e),
      "There was an issue opening the websocket... hard fail..."
    );
    PrinterTicker.addIssue(
      new Date(),
      farmPrinters[this.index].printerURL,
      "Client error, setting back up... in 10000ms",
      "Offline",
      farmPrinters[this.index]._id
    );
    setTimeout(async () => {
      Runner.reScanOcto(farmPrinters[this.index]._id);
      logger.info("Error with websockets... resetting up!");
    }, 10000);
  }
};
WebSocketClient.prototype.throttle = function (data) {
  PrinterTicker.addIssue(
    new Date(),
    farmPrinters[this.index].printerURL,
    "Throttling websocket connection...",
    "Active",
    farmPrinters[this.index]._id
  );
  try {
    logger.info(
      `Throttling your websocket connection: ${this.index}: ${this.url} `,
      data
    );
    this.instance.send(JSON.stringify(data));
  } catch (e) {
    logger.error(`Failed to Throttle websocket: ${this.index}: ${this.url}`);
    this.instance.emit("error", e);
  }
};
WebSocketClient.prototype.send = function (data, option) {
  try {
    this.instance.send(data, option).then((res) => console.log(res));
  } catch (e) {
    this.instance.emit("error", e);
  }
};
WebSocketClient.prototype.reconnect = async function (e) {
  PrinterTicker.addIssue(
    new Date(),
    farmPrinters[this.index].printerURL,
    "Connection lost... reconnecting in: " + this.autoReconnectInterval + "ms",
    "Active",
    farmPrinters[this.index]._id
  );
  logger.info(
    `WebSocketClient: retry in ${this.autoReconnectInterval}ms`,
    `${e + this.index}: ${this.url}`
  );
  this.instance.removeAllListeners();
  const that = this;

  that.timeout = setTimeout(async function () {
    farmPrinters[that.index].hostStateColour = Runner.getColour("Searching...");
    farmPrinters[that.index].hostDescription = "Searching for Host";
    logger.info(`Re-Opening Websocket: ${that.index}: ${that.url}`);
    if (typeof farmPrinters[that.index] !== "undefined") {
      PrinterClean.generate(
        farmPrinters[that.index],
        systemSettings.filamentManager
      );
    }
    that.open(that.url, that.index);
  }, this.autoReconnectInterval);
  return true;
};

WebSocketClient.prototype.onopen = async function (e) {
  const Polling = systemSettings.onlinePolling;
  const data = {};
  const throt = {};
  data.auth = `${farmPrinters[this.index].currentUser}:${
    farmPrinters[this.index].sessionKey
  }`;
  throt.throttle = parseInt((Polling.seconds * 1000) / 500);

  this.instance.send(JSON.stringify(data));
  this.instance.send(JSON.stringify(throt));
  PrinterTicker.addIssue(
    new Date(),
    farmPrinters[this.index].printerURL,
    "Opened the websocket connection...",
    "Active",
    farmPrinters[this.index]._id
  );
  if (typeof farmPrinters[this.index] !== "undefined") {
    PrinterClean.generate(
      farmPrinters[this.index],
      systemSettings.filamentManager
    );
  }
};

WebSocketClient.prototype.onmessage = async function (data, flags, number) {
  try {
    // Listen for print jobs
    farmPrinters[this.index].hostState = "Online";
    farmPrinters[this.index].hostStateColour = Runner.getColour("Online");
    farmPrinters[this.index].hostDescription = "Host is Online";
    data = await JSON.parse(data);
    if (typeof data.connected !== "undefined") {
      farmPrinters[this.index].octoPrintVersion = data.connected.version;
      farmPrinters[this.index].plugin_hash = data.connected.plugin_hash;
      farmPrinters[this.index].config_hash = data.connected.config_hash;

      if (
        data.connected.version.includes("1.4.2") ||
        data.connected.version.includes("1.4.1")
      ) {
        farmPrinters[this.index].webSocket = "danger";
        farmPrinters[this.index].webSocketDescription =
          "OctoPrint Version 1.4.1+ requires the use of an Application/User API key to connect, please update your instance with that";
      }
    }
    if (data.history) {
      farmPrinters[this.index].webSocket = "warning";
      farmPrinters[this.index].webSocketDescription =
        "Websocket Connected but in Tentative state until receiving data";
      farmPrinters[this.index].state = "Disconnected";
      farmPrinters[this.index].stateColour = Runner.getColour("Disconnected");
      PrinterTicker.addIssue(
        new Date(),
        farmPrinters[this.index].printerURL,
        "Successfully opened websocket connection...",
        "Complete",
        farmPrinters[this.index]._id
      );
    }
    // Listen for printer status
    if (typeof data.current !== "undefined") {
      farmPrinters[this.index].webSocket = "success";
      farmPrinters[this.index].webSocketDescription =
        "Websocket Alive and Receiving Data";
      if (data.current.state.text === "Offline") {
        data.current.state.text = "Disconnected";
        farmPrinters[this.index].stateDescription =
          "Your printer is disconnected";
      } else if (
        data.current.state.text.includes("Error:") ||
        data.current.state.text.includes("error")
      ) {
        farmPrinters[this.index].stateDescription = data.current.state.text;
        data.current.state.text = "Error!";
      } else if (data.current.state.text === "Closed") {
        res.current.state.text = "Disconnected";
        farmPrinters[this.index].stateDescription =
          "Your printer is disconnected";
      } else {
        farmPrinters[this.index].stateDescription =
          "Current Status from OctoPrint";
      }
      farmPrinters[this.index].state = data.current.state.text;
      farmPrinters[this.index].stateColour = Runner.getColour(
        data.current.state.text
      );
      if (typeof data.current.resends !== "undefined") {
        farmPrinters[this.index].resends = data.current.resends;
      }

      if (typeof data.current.progress !== "undefined") {
        farmPrinters[this.index].progress = data.current.progress;
      } else {
        farmPrinters[this.index].progress = 0;
      }
      if (
        typeof data.current.currentZ !== "undefined" &&
        data.currentZ !== null
      ) {
        farmPrinters[this.index].currentZ = data.current.currentZ;
      }
      if (
        typeof data.current.job !== "undefined" &&
        data.current.job.user !== null
      ) {
        farmPrinters[this.index].job = data.current.job;
        const currentFileIndex = _.findIndex(
          farmPrinters[this.index].fileList.files,
          function (o) {
            return o.name === data.current.job.file.name;
          }
        );
        if (currentFileIndex > -1) {
          if (
            typeof farmPrinters[this.index].fileList.files[currentFileIndex] !==
              "undefined" &&
            farmPrinters[this.index].fileList.files[currentFileIndex]
              .thumbnail != null
          ) {
            farmPrinters[this.index].job.file.thumbnail =
              farmPrinters[this.index].fileList.files[
                currentFileIndex
              ].thumbnail;
          }
          if (
            typeof farmPrinters[this.index].fileList.files[currentFileIndex] !==
            "undefined"
          ) {
            farmPrinters[this.index].job.file.length =
              farmPrinters[this.index].fileList.files[currentFileIndex].length;
          }
        }
        const currentFilament = JSON.parse(
          JSON.stringify(farmPrinters[this.index].selectedFilament)
        );
        for (
          let s = 0;
          s < farmPrinters[this.index].selectedFilament.length;
          s++
        ) {
          if (farmPrinters[this.index].selectedFilament[s] !== null) {
            let profile = null;
            if (systemSettings.filamentManager) {
              profile = await Profiles.findOne({
                "profile.index": parseInt(
                  farmPrinters[this.index].selectedFilament[s].spools.profile
                )
              });
            } else {
              profile = await Profiles.findById(
                farmPrinters[this.index].selectedFilament[s].spools.profile
              );
            }
            currentFilament[s].spools.profile = profile.profile;
          }
        }
        JobClean.generate(farmPrinters[this.index], currentFilament);
      } else {
        const currentFilament = JSON.parse(
          JSON.stringify(farmPrinters[this.index].selectedFilament)
        );
        for (
          let s = 0;
          s < farmPrinters[this.index].selectedFilament.length;
          s++
        ) {
          if (farmPrinters[this.index].selectedFilament[s] !== null) {
            let profile = null;
            if (systemSettings.filamentManager) {
              profile = await Profiles.findOne({
                "profile.index": parseInt(
                  farmPrinters[this.index].selectedFilament[s].spools.profile
                )
              });
            } else {
              profile = await Profiles.findById(
                farmPrinters[this.index].selectedFilament[s].spools.profile
              );
            }
            currentFilament[s].spools.profile = profile.profile;
          }
        }
        JobClean.generate(farmPrinters[this.index], currentFilament);
      }

      if (typeof data.current.logs !== undefined) {
        farmPrinters[this.index].logs = data.current.logs;
      }
      if (
        typeof data.current.temps !== "undefined" &&
        data.current.temps.length !== 0
      ) {
        if (typeof data.current.temps[0].tool0 !== "undefined") {
          farmPrinters[this.index].temps = data.current.temps;
          let timeStamp = new Date();
          timeStamp = timeStamp.getTime();
          if (typeof farmPrinters[this.index].tempTimer === "undefined") {
            farmPrinters[this.index].tempTimer = 1500;
            data.current.temps[0].time = timeStamp;
          } else {
            if (farmPrinters[this.index].tempTimer >= 2500) {
              data.current.temps[0].time = timeStamp;
              let temps = {
                currentTemp: data.current.temps[0],
                printer_id: farmPrinters[this.index]._id
              };
              if (farmPrinters[this.index].stateColour.category !== "Offline") {
                const newTemp = await new TempHistory(temps);
                await newTemp.save();
              }
              farmPrinters[this.index].tempTimer = 0;
            } else {
              farmPrinters[this.index].tempTimer =
                farmPrinters[this.index].tempTimer + 1000;
            }
          }
        }
      }
      if (
        data.current.progress.completion != null &&
        data.current.progress.completion === 100
      ) {
        farmPrinters[this.index].stateColour = Runner.getColour("Complete");
        farmPrinters[this.index].stateDescription =
          "Your current print is Completed!";
      } else {
        farmPrinters[this.index].stateColour = Runner.getColour(
          data.current.state.text
        );
      }
    }
    if (typeof data.event !== "undefined") {
      if (data.event.type === "PrintPaused") {
        const that = this;
        ScriptRunner.check(farmPrinters[that.index], "paused");
      }
      if (data.event.type === "PrintFailed") {
        const that = this;
        setTimeout(async function () {
          logger.info(`${data.event.type + that.index}: ${that.url}`);
          let sendPrinter = {};
          sendPrinter = JSON.parse(JSON.stringify(farmPrinters[that.index]));
          let job = {};
          job = JSON.parse(JSON.stringify(farmPrinters[that.index].job));
          let files = {};
          files = JSON.parse(
            JSON.stringify(farmPrinters[that.index].fileList.files)
          );
          let resendStats = null;
          if (typeof farmPrinters[that.index].resends !== "undefined") {
            resendStats = JSON.parse(
              JSON.stringify(farmPrinters[that.index].resends)
            );
          }

          // Register cancelled print...
          await HistoryCollection.failed(
            data.event.payload,
            sendPrinter,
            job,
            files,
            resendStats
          );
          await Runner.updateFilament();
          setTimeout(async function () {
            await Runner.reSyncFile(
              farmPrinters[that.index]._id,
              farmPrinters[that.index].job.file.path
            );
          }, 5000);
        }, 10000);
      }
      if (data.event.type === "PrintDone") {
        const that = this;
        setTimeout(async function () {
          logger.info(`${data.event.type + that.index}: ${that.url}`);
          let sendPrinter = {};
          sendPrinter = JSON.parse(JSON.stringify(farmPrinters[that.index]));
          let job = {};
          job = JSON.parse(JSON.stringify(farmPrinters[that.index].job));
          let files = {};
          files = JSON.parse(
            JSON.stringify(farmPrinters[that.index].fileList.files)
          );
          let resendStats = null;
          if (typeof farmPrinters[that.index].resends !== "undefined") {
            resendStats = JSON.parse(
              JSON.stringify(farmPrinters[that.index].resends)
            );
          }
          // Register cancelled print...

          await HistoryCollection.complete(
            data.event.payload,
            sendPrinter,
            job,
            files,
            resendStats
          );
          await Runner.updateFilament();
          setTimeout(async function () {
            await Runner.reSyncFile(
              farmPrinters[that.index]._id,
              farmPrinters[that.index].job.file.path
            );
          }, 500);
        }, 10000);
      }
      if (data.event.type === "Error") {
        const that = this;
        setTimeout(async function () {
          logger.info(`${data.event.type + that.index}: ${that.url}`);
          let sendPrinter = {};
          sendPrinter = JSON.parse(JSON.stringify(farmPrinters[that.index]));
          let job = {};
          let files = {};
          files = JSON.parse(
            JSON.stringify(farmPrinters[that.index].fileList.files)
          );
          if (farmPrinters[that.index].job) {
            job = JSON.parse(JSON.stringify(farmPrinters[that.index].job));
          }
          // Register cancelled print...
          await HistoryCollection.errorLog(
            data.event.payload,
            sendPrinter,
            job,
            files
          );
          await Runner.updateFilament();
          setTimeout(async function () {
            if (!_.isEmpty(job)) {
              await Runner.reSyncFile(
                farmPrinters[that.index]._id,
                job.file.path
              );
            }
          }, 500);
        }, 10000);
      }
    }
    if (data.plugin) {
      //console.log(farmPrinters[this.index].printerURL, data.plugin);
      if (data.plugin.data.type === "loglines") {
        if (
          typeof data.plugin.data !== "undefined" &&
          typeof data.plugin.data.loglines !== "undefined"
        ) {
          data.plugin.data.loglines.forEach((logLine) => {
            if (logLine.stream === "call" || logLine.stream === "message") {
              PrinterTicker.addOctoPrintLog(
                farmPrinters[this.index],
                logLine.line,
                "Active",
                data.plugin.plugin
              );
            } else if (logLine.stream === "stdout") {
              PrinterTicker.addOctoPrintLog(
                farmPrinters[this.index],
                logLine.line,
                "Complete",
                data.plugin.plugin
              );
            } else {
              PrinterTicker.addOctoPrintLog(
                farmPrinters[this.index],
                logLine.line,
                "Offline",
                data.plugin.plugin
              );
            }
          });
        }
      }
      if (data.plugin.plugin === "klipper") {
        // console.log(data.plugin.data.payload);
        if (data.plugin.data.payload.includes("Firmware version:")) {
          farmPrinters[this.index].klipperFirmwareVersion =
            data.plugin.data.payload.replace("Firmware version: ", "");
        }
      }
    }
    // Event Listeners for state changes
    if (typeof farmPrinters[this.index].temps !== "undefined") {
      // When object changes to active, add event listener awaiting cool down.
      if (farmPrinters[this.index].stateColour.category === "Active") {
        // Check for existing events object...
        if (typeof farmPrinters[this.index].events === "undefined") {
          farmPrinters[this.index].events = new EventEmitter();
        }
        if (
          typeof farmPrinters[this.index].events._events.cooldown ===
          "undefined"
        ) {
          const that = this;
          farmPrinters[this.index].events.once("cooldown", (stream) => {
            ScriptRunner.check(farmPrinters[that.index], "cooldown");
          });
        }
      }
      if (farmPrinters[this.index].stateColour.category === "Complete") {
        if (typeof farmPrinters[this.index].events !== "undefined") {
          if (typeof farmPrinters[this.index].temps !== "undefined") {
            if (
              parseFloat(farmPrinters[this.index].temps[0].tool0.actual) <
                parseFloat(farmPrinters[this.index].tempTriggers.coolDown) &&
              parseFloat(farmPrinters[this.index].temps[0].bed.actual) <
                parseFloat(farmPrinters[this.index].tempTriggers.coolDown)
            ) {
              farmPrinters[this.index].events.emit("cooldown");
            }
          }
        }
      }
    }
    // Information cleaning of farmPrinters
    if (typeof farmPrinters[this.index] !== "undefined") {
      PrinterClean.generate(farmPrinters[this.index], filamentManager);
    }
  } catch (e) {
    console.log("Safe to ignore", e);
  }
};
WebSocketClient.prototype.onerror = function (e) {
  PrinterTicker.addIssue(
    new Date(),
    farmPrinters[this.index].printerURL,
    "Whoopsy! Big error...",
    "Offline",
    farmPrinters[this.index]._id
  );
  logger.error(
    "WebSocketClient: Error",
    // eslint-disable-next-line prefer-rest-params
    arguments,
    `${+this.index}: ${this.url} - ${e}`
  );
  this.instance.removeAllListeners();
  try {
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
  } catch (e) {
    logger.info(
      JSON.stringify(e),
      "Couldn't delete old listeners... must not exist."
    );
  }

  if (typeof farmPrinters[this.index] !== "undefined") {
    //Reset job to null on error...
    farmPrinters[this.index].job = null;
    JobClean.generate(farmPrinters[this.index]);
    PrinterClean.generate(
      farmPrinters[this.index],
      systemSettings.filamentManager
    );
  }
};
WebSocketClient.prototype.onclose = function (e) {
  if (typeof farmPrinters[this.index] !== "undefined") {
    PrinterTicker.addIssue(
      new Date(),
      farmPrinters[this.index].printerURL,
      "Client closed...",
      "Offline",
      farmPrinters[this.index]._id
    );
  }

  logger.info(
    "WebSocketClient: Closed",
    // eslint-disable-next-line prefer-rest-params
    arguments,
    `${this.index}: ${this.url} - ${e}`
  );
  this.instance.removeAllListeners();
  try {
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
  } catch (e) {
    logger.info(
      JSON.stringify(e),
      "Couldn't delete old listeners... must not exist."
    );
  }

  if (typeof farmPrinters[this.index] !== "undefined") {
    //Reset job to null on error...
    farmPrinters[this.index].job = null;
    JobClean.generate(farmPrinters[this.index]);
    PrinterClean.generate(
      farmPrinters[this.index],
      systemSettings.filamentManager
    );
  }
};

class Runner {
  static octoPrintService = undefined;

  static async init() {
    farmPrinters = [];
    const server = await ServerSettings.check();
    systemSettings = server[0];
    timeout = systemSettings.timeout;

    this.octoPrintService = new OctoprintApiClientService(timeout);
    await HistoryCollection.inject(this.octoPrintService);

    // Grab printers from database....
    try {
      farmPrinters = await Printers.find({}, null, {
        sort: { sortIndex: 1 }
      });

      for (let i = 0; i < farmPrinters.length; i++) {
        // Make sure runners are created ready for each printer to pass between...
        await Runner.setDefaults(farmPrinters[i]._id);
      }
    } catch (err) {
      const error = {
        err: err.message,
        action: "Database connection failed... No action taken",
        userAction:
          "Please make sure the database URL is inputted and can be reached... 'file located at: config/db.js'"
      };
      logger.error(err);
      console.log(err);
    }

    // cycle through printers and move them to correct checking location...
    setTimeout(async function () {
      for (let i = 0; i < farmPrinters.length; i++) {
        // Make sure runners are created ready for each printer to pass between...
        await Runner.setupWebSocket(farmPrinters[i]._id);
        PrinterClean.generate(farmPrinters[i], systemSettings.filamentManager);
      }
      // FilamentClean.start(systemSettings.filamentManager);
    }, 5000);
  }

  static async compareEnteredKeyToGlobalKey(printer) {
    // Compare entered API key to settings API Key...
    const globalAPIKeyCheck = await this.octoPrintService.getSettings(
      printer,
      true
    );
    const errorCode = {
      message:
        "Global API Key detected... unable to authenticate websocket connection",
      type: "system",
      errno: "999",
      code: "999"
    };
    if (globalAPIKeyCheck.status === 200) {
      //Safe to continue check
      const settingsData = await globalAPIKeyCheck.json();
      if (!settingsData) {
        logger.error(`Settings json does not exist: ${printer.printerURL}`);
        return errorCode;
      }
      if (!settingsData.api) {
        logger.error(`API key does not exist: ${printer.printerURL}`);
        return errorCode;
      }
      if (settingsData.api.key === printer.apikey) {
        logger.error(`API Key matched global API key: ${printer.printerURL}`);
        return errorCode;
      }

      return true;
    } else {
      // Hard failure as can't contact api
      return {
        message: "Could not Establish connection to OctoPrint Returned",
        type: "system",
        errno: "503",
        code: "503"
      };
    }
  }

  static async setupWebSocket(id, skipAPICheck) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    try {
      if (i === -1) {
        const error = {
          message: "Could not find printer...:",
          type: "system",
          errno: "DELETED",
          code: "DELETED"
        };
        throw error;
      }
      farmPrinters[i].systemChecks.scanning.api.status = "warning";
      const ws = new WebSocketClient();
      farmPrinters[i].state = "Searching...";
      farmPrinters[i].stateColour = Runner.getColour("Searching...");
      farmPrinters[i].hostState = "Searching...";
      farmPrinters[i].hostStateColour = Runner.getColour("Searching...");
      farmPrinters[i].webSocket = "danger";
      farmPrinters[i].stateDescription = "Attempting to connect to OctoPrint";
      farmPrinters[i].hostDescription = "Attempting to connect to OctoPrint";
      farmPrinters[i].webSocketDescription = "Websocket Offline";
      farmPrinters[i].ws = ws;
      if (typeof farmPrinters[i] !== "undefined") {
        PrinterClean.generate(farmPrinters[i], systemSettings.filamentManager);
      }
      let globalAPICheck = await this.compareEnteredKeyToGlobalKey(
        farmPrinters[i]
      );
      if (typeof globalAPICheck === "object") {
        throw globalAPICheck;
      }
      // Make a connection attempt, and grab current user.
      let users = await this.octoPrintService.getUsers(farmPrinters[i], true);
      if (users.status === 200) {
        farmPrinters[i].systemChecks.scanning.api.status = "success";
        farmPrinters[i].systemChecks.scanning.api.date = new Date();

        users = await users.json();

        if (_.isEmpty(users)) {
          farmPrinters[i].currentUser = "admin";
          farmPrinters[i].markModified("currentUser");
          farmPrinters[i].updateOne();
        } else {
          users.users.forEach((user) => {
            if (user.admin) {
              farmPrinters[i].currentUser = user.name;
              farmPrinters[i].markModified("currentUser");
              farmPrinters[i].updateOne();
            }
          });
        }
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[i].printerURL,
          `Attempting passive login with user: ${farmPrinters[i].currentUser}`,
          "Active",
          farmPrinters[i]._id
        );

        const sessionKey = await this.octoPrintService.login(
          farmPrinters[i],
          true
        );

        if (sessionKey.status === 200) {
          PrinterTicker.addIssue(
            new Date(),
            farmPrinters[i].printerURL,
            `Passive Login Succeded with user: ${farmPrinters[i].currentUser}`,
            "Complete",
            farmPrinters[i]._id
          );
          const sessionJson = await sessionKey.json();

          farmPrinters[i].sessionKey = sessionJson.session;
          // Update info via API
          farmPrinters[i].hostState = "Online";
          farmPrinters[i].hostStateColour = Runner.getColour("Online");
          farmPrinters[i].hostDescription = "Host is Online";
          await Runner.getSystem(id);
          await Runner.getSettings(id);
          await Runner.getProfile(id);
          await Runner.getState(id);
          await Runner.getOctoPrintSystenInfo(id);
          await Runner.getPluginList(id);
          await Runner.getUpdates(id);
          if (
            typeof farmPrinters[i].fileList === "undefined" ||
            typeof farmPrinters[i].storage === "undefined"
          ) {
            await Runner.getFiles(id, true);
          } else {
            const currentFilament = await Runner.compileSelectedFilament(
              farmPrinters[i].selectedFilament,
              i
            );
            FileClean.generate(farmPrinters[i], currentFilament);
            farmPrinters[i].systemChecks.scanning.files.status = "success";
            farmPrinters[i].systemChecks.scanning.files.date = new Date();
            FileClean.statistics(farmPrinters);
          }

          // Connection to API successful, gather initial data and setup websocket.
          PrinterTicker.addIssue(
            new Date(),
            farmPrinters[i].printerURL,
            "API checks successful",
            "Complete",
            farmPrinters[i]._id
          );
          await farmPrinters[i].ws.open(
            `${farmPrinters[i].webSocketURL}/sockjs/websocket`,
            i
          );
        } else {
          const error = {
            message: `Could not Establish connection to OctoPrint Returned: ${users.status}: ${farmPrinters[i].printerURL}`,
            type: "system",
            errno: "503",
            code: "503"
          };

          throw error;
        }
      } else if (users.status === 503 || users.status === 404) {
        const error = {
          message: `Could not Establish connection to OctoPrint Returned: ${users.status}: ${farmPrinters[i].printerURL}`,
          type: "system",
          errno: "503",
          code: "503"
        };
        throw error;
      } else if (users.status === 502) {
        const error = {
          message: `Bad gateway! Gather OcotPrint is still booting: ${users.status}: ${farmPrinters[i].printerURL}`,
          type: "system",
          errno: "ECONNREFUSED",
          code: "ECONNREFUSED"
        };
      } else {
        const error = {
          message: `Could not Establish API Connection: ${users.status}${farmPrinters[i].printerURL}`,
          type: "system",
          errno: "NO-API",
          code: "NO-API"
        };
        throw error;
      }
    } catch (e) {
      switch (e.code) {
        case "NO-API":
          try {
            logger.error(
              e.message,
              `Couldn't grab initial connection for Printer: ${farmPrinters[i].printerURL}`
            );
            PrinterTicker.addIssue(
              new Date(),
              farmPrinters[i].printerURL,
              `${e.message}: API issues... halting!`,
              "Disconnected",
              farmPrinters[i]._id
            );
            farmPrinters[i].state = "No-API";
            farmPrinters[i].stateColour = Runner.getColour("No-API");
            farmPrinters[i].hostState = "Online";
            farmPrinters[i].hostStateColour = Runner.getColour("Online");
            farmPrinters[i].webSocket = "danger";
            farmPrinters[i].stateDescription =
              "Could not connect to OctoPrints API please correct and manually refresh your printer";
            farmPrinters[i].hostDescription = "Host is Online";
            farmPrinters[i].webSocketDescription = "Websocket Offline";
            if (typeof farmPrinters[i] !== "undefined") {
              PrinterClean.generate(
                farmPrinters[i],
                systemSettings.filamentManager
              );
            }
          } catch (e) {
            logger.error(
              `Couldn't set state of missing printer, safe to ignore: ${farmPrinters[i].index}: ${farmPrinters[i].printerURL}`
            );
          }
          break;
        case "999":
          try {
            logger.error(
              e.message,
              `Please generate an Application or User API Key to connect: ${farmPrinters[i].printerURL}`
            );
            PrinterTicker.addIssue(
              new Date(),
              farmPrinters[i].printerURL,
              `${e.message}: Please generate an Application or User API Key to connect...`,
              "Disconnected",
              farmPrinters[i]._id
            );
            farmPrinters[i].state = "Incorrect API Key";
            farmPrinters[i].stateColour = Runner.getColour("Offline");
            farmPrinters[i].hostState = "Online";
            farmPrinters[i].hostStateColour = Runner.getColour("Online");
            farmPrinters[i].webSocket = "danger";
            farmPrinters[i].stateDescription = "OctoPrint is Offline";
            farmPrinters[i].hostDescription = "Host is Online";
            farmPrinters[i].webSocketDescription = "Websocket Offline";
            if (typeof farmPrinters[i] !== "undefined") {
              PrinterClean.generate(
                farmPrinters[i],
                systemSettings.filamentManager
              );
            }
          } catch (e) {
            logger.error(
              "Couldn't set state of missing printer, safe to ignore"
            );
          }
          break;
        case "ECONNREFUSED":
          try {
            logger.error(
              e.message,
              `Couldn't grab initial connection for Printer: ${farmPrinters[i].printerURL}`
            );
            PrinterTicker.addIssue(
              new Date(),
              farmPrinters[i].printerURL,
              `${e.message}: Connection refused, trying again in: ${
                systemSettings.timeout.apiRetry / 1000
              } seconds`,
              "Disconnected",
              farmPrinters[i]._id
            );
            farmPrinters[i].state = "Offline";
            farmPrinters[i].stateColour = Runner.getColour("Offline");
            farmPrinters[i].hostState = "Online";
            farmPrinters[i].hostStateColour = Runner.getColour("Online");
            farmPrinters[i].webSocket = "danger";
            farmPrinters[i].stateDescription = "OctoPrint is Offline";
            farmPrinters[i].hostDescription = "Host is Online";
            farmPrinters[i].webSocketDescription = "Websocket Offline";
            if (typeof farmPrinters[i] !== "undefined") {
              PrinterClean.generate(
                farmPrinters[i],
                systemSettings.filamentManager
              );
            }
          } catch (e) {
            logger.error(
              "Couldn't set state of missing printer, safe to ignore"
            );
          }
          timeout = systemSettings.timeout;
          setTimeout(function () {
            Runner.setupWebSocket(id);
          }, timeout.apiRetry);
          break;
        case "ENOTFOUND":
          try {
            logger.error(
              e.message,
              `Couldn't grab initial connection for Printer: ${farmPrinters[i].printerURL}`
            );
            PrinterTicker.addIssue(
              new Date(),
              farmPrinters[i].printerURL,
              `${e.message}: Host not found, halting...`,
              "Disconnected",
              farmPrinters[i]._id
            );
            farmPrinters[i].state = "Offline";
            farmPrinters[i].stateColour = Runner.getColour("Offline");
            farmPrinters[i].hostState = "Online";
            farmPrinters[i].hostStateColour = Runner.getColour("Online");
            farmPrinters[i].webSocket = "danger";
            farmPrinters[i].stateDescription = "OctoPrint is Offline";
            farmPrinters[i].hostDescription = "Host is Online";
            farmPrinters[i].webSocketDescription = "Websocket Offline";
            if (typeof farmPrinters[i] !== "undefined") {
              PrinterClean.generate(
                farmPrinters[i],
                systemSettings.filamentManager
              );
            }
          } catch (e) {
            logger.error(
              "Couldn't set state of missing printer, safe to ignore"
            );
          }
          break;
        case "DELETED":
          logger.error(e.message, "Printer Deleted... Do not retry to connect");
          break;
        default:
          try {
            logger.error(
              e.message,
              `Couldn't grab initial connection for Printer: ${farmPrinters[i].printerURL}`
            );
            PrinterTicker.addIssue(
              new Date(),
              farmPrinters[i].printerURL,
              `${e.message} retrying in ${timeout.apiRetry / 1000} seconds`,
              "Disconnected",
              farmPrinters[i]._id
            );
            farmPrinters[i].state = "Offline";
            farmPrinters[i].stateColour = Runner.getColour("Offline");
            farmPrinters[i].hostState = "Shutdown";
            farmPrinters[i].hostStateColour = Runner.getColour("Shutdown");
            farmPrinters[i].webSocket = "danger";
            farmPrinters[i].stateDescription = "OctoPrint is Offline";
            farmPrinters[i].hostDescription = "Host is Shutdown";
            farmPrinters[i].webSocketDescription = "Websocket Offline";
          } catch (e) {
            logger.error(
              `Couldn't set state of missing printer, safe to ignore: ${farmPrinters[i].index}: ${farmPrinters[i].printerURL}`
            );
          }
          if (typeof farmPrinters[i] !== "undefined") {
            PrinterClean.generate(
              farmPrinters[i],
              systemSettings.filamentManager
            );
          }
          timeout = systemSettings.timeout;
          setTimeout(function () {
            Runner.setupWebSocket(id);
          }, timeout.apiRetry);
          break;
      }
    }
    if (typeof farmPrinters[i] !== "undefined") {
      PrinterClean.generate(farmPrinters[i], systemSettings.filamentManager);
    }

    return true;
  }

  static async updateGroupList() {
    farmPrintersGroups = [];
    let stateDefaults = [
      "All Printers",
      "State: Idle",
      "State: Active",
      "State: Complete",
      "State: Disconnected"
    ];
    stateDefaults.forEach((def) => {
      farmPrintersGroups.push(def);
    });
    farmPrinters.forEach((printer) => {
      if (!farmPrintersGroups.includes(`Group: ${printer.group}`)) {
        if (!_.isEmpty(printer.group)) {
          farmPrintersGroups.push(`Group: ${printer.group}`);
        }
      }
    });
  }

  static returnGroupList() {
    return farmPrintersGroups;
  }

  static async setDefaults(id) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    const printer = await Printers.findById(id);
    PrinterTicker.addIssue(
      new Date(),
      farmPrinters[i].printerURL,
      "Initiating Printer...",
      "Active",
      farmPrinters[i]._id
    );

    farmPrinters[i].state = "Setting Up";
    farmPrinters[i].stateColour = Runner.getColour("Offline");
    farmPrinters[i].hostState = "Setting Up";
    farmPrinters[i].hostStateColour = Runner.getColour("Offline");
    farmPrinters[i].webSocket = "danger";
    farmPrinters[i].stateDescription = "Setting up your Printer";
    farmPrinters[i].hostDescription = "Setting up your Printer";
    farmPrinters[i].webSocketDescription = "Websocket is Offline";
    farmPrinters[i].stepRate = 10;
    PrinterClean.generate(farmPrinters[i], systemSettings.filamentManager);
    farmPrinters[i].systemChecks = {
      scanning: {
        api: {
          status: "danger",
          date: null
        },
        files: {
          status: "danger",
          date: null
        },
        state: {
          status: "danger",
          date: null
        },
        profile: {
          status: "danger",
          date: null
        },
        settings: {
          status: "danger",
          date: null
        },
        system: {
          status: "danger",
          date: null
        }
      },
      cleaning: {
        information: {
          status: "danger",
          date: null
        },
        file: {
          status: "danger",
          date: null
        },
        job: {
          status: "danger",
          date: null
        }
      }
    };

    if (typeof farmPrinters[i].dateAdded === "undefined") {
      let currentTime = new Date();
      currentTime = currentTime.getTime();
      farmPrinters[i].dateAdded = currentTime;
    }
    if (typeof farmPrinters[i].settingsApperance !== "undefined") {
      farmPrinters[i].settingsAppearance = farmPrinters[i].settingsApperance;
    }
    if (typeof farmPrinters[i].alerts === "undefined") {
      farmPrinters[i].alerts = null;
    }
    if (
      typeof farmPrinters[i].powerSettings === "undefined" ||
      farmPrinters[i].powerSettings === null
    ) {
      farmPrinters[i].powerSettings = {
        powerOnCommand: "",
        powerOnURL: "",
        powerOffCommand: "",
        powerOffURL: "",
        powerToggleCommand: "",
        powerToggleURL: "",
        powerStatusCommand: "",
        powerStatusURL: "",
        wol: {
          enabled: false,
          ip: "255.255.255.0",
          packets: "3",
          port: "9",
          interval: "100",
          MAC: ""
        }
      };
    }

    if (typeof farmPrinters[i].currentIdle === "undefined") {
      farmPrinters[i].currentIdle = 0;
    }
    if (typeof farmPrinters[i].currentActive === "undefined") {
      farmPrinters[i].currentActive = 0;
    }
    if (typeof farmPrinters[i].currentOffline === "undefined") {
      farmPrinters[i].currentOffline = 0;
    }
    if (
      typeof farmPrinters[i].selectedFilament === "undefined" &&
      !Array.isArray(farmPrinters[i].selectedFilament)
    ) {
      farmPrinters[i].selectedFilament = [];
    }
    if (typeof farmPrinters[i].octoPrintVersion === "undefined") {
      farmPrinters[i].octoPrintVersion = "";
    }
    if (typeof farmPrinters[i].tempTriggers === "undefined") {
      farmPrinters[i].tempTriggers = {
        heatingVariation: 1,
        coolDown: 30
      };
    }
    if (typeof farmPrinters[i].feedRate === "undefined") {
      farmPrinters[i].feedRate = 100;
    }
    if (typeof farmPrinters[i].flowRate === "undefined") {
      farmPrinters[i].flowRate = 100;
    }
    if (typeof farmPrinters[i].sortIndex === "undefined") {
      if (farmPrinters.length === 0) {
        farmPrinters[i].sortIndex = 0;
      } else if (farmPrinters.length > 0) {
        farmPrinters[i].sortIndex = farmPrinters.length - 1;
      }
    }
    if (typeof farmPrinters[i].group === "undefined") {
      farmPrinters[i].group = "";
    }

    if (typeof farmPrinters[i].printerURL === "undefined") {
      farmPrinters[
        i
      ].printerURL = `http://${farmPrinters[i].ip}:${farmPrinters[i].port}`;
    }
    if (
      typeof farmPrinters[i].printerURL !== "undefined" &&
      !farmPrinters[i].printerURL.includes("https://") &&
      !farmPrinters[i].printerURL.includes("http://")
    ) {
      farmPrinters[i].printerURL = `http://${farmPrinters[i].printerURL}`;
    }
    //Check for trailing slash and remove...
    if (
      farmPrinters[i].printerURL[farmPrinters[i].printerURL.length - 1] === "/"
    ) {
      farmPrinters[i].printerURL = farmPrinters[i].printerURL.replace(
        /\/?$/,
        ""
      );
    }
    if (!farmPrinters[i].webSocketURL) {
      farmPrinters[i].webSocketURL = convertHttpUrlToWebsocket(
        farmPrinters[i].printerURL
      );
    }
    if (
      typeof farmPrinters[i].camURL !== "undefined" &&
      farmPrinters[i].camURL !== "" &&
      !farmPrinters[i].camURL.includes("http")
    ) {
      farmPrinters[i].camURL = `http://${farmPrinters[i].camURL}`;
    }
    if (
      typeof farmPrinters[i].costSettings === "undefined" ||
      _.isEmpty(farmPrinters[i].costSettings)
    ) {
      farmPrinters[i].costSettings = {
        powerConsumption: 0.5,
        electricityCosts: 0.15,
        purchasePrice: 500,
        estimateLifespan: 43800,
        maintenanceCosts: 0.25
      };
    }
    printer.octoPrintVersion = farmPrinters[i].octoPrintVersion;
    printer.printerName = farmPrinters[i].printerName;
    printer.camURL = farmPrinters[i].camURL;
    printer.printerURL = farmPrinters[i].printerURL;
    printer.webSocketURL = farmPrinters[i].webSocketURL;
    printer.feedRate = farmPrinters[i].feedRate;
    printer.flowRate = farmPrinters[i].flowRate;
    printer.sortIndex = farmPrinters[i].sortIndex;
    printer.tempTriggers = farmPrinters[i].tempTriggers;
    printer.dateAdded = farmPrinters[i].dateAdded;
    printer.currentIdle = farmPrinters[i].currentIdle;
    printer.currentActive = farmPrinters[i].currentActive;
    printer.currentOffline = farmPrinters[i].currentOffline;
    printer.selectedFilament = farmPrinters[i].selectedFilament;
    printer.powerSettings = farmPrinters[i].powerSettings;
    printer.alerts = farmPrinters[i].alerts;
    printer.costSettings = farmPrinters[i].costSettings;
    await printer.save();
    Runner.updateGroupList();
    return true;
  }

  static async addPrinters(printers) {
    logger.info("Adding single printer to farm");
    // Shim for name change
    printers[0].settingsApperance = printers[0].settingsAppearance;
    // Only adding a single printer
    const newPrinter = await new Printers(printers[0]);
    await newPrinter.save();
    logger.info(`Saved new Printer: ${newPrinter.printerURL}`);
    farmPrinters.push(newPrinter);
    // Regenerate sort index on printer add...
    await this.reGenerateSortIndex();
    await this.setDefaults(newPrinter._id);
    await this.setupWebSocket(newPrinter._id);
    return [newPrinter];
  }

  static async updatePrinters(printers) {
    // Updating printer's information
    logger.info("Pausing runners to update printers...");
    let changes = [];
    for (let i = 0; i < printers.length; i++) {
      const index = _.findIndex(farmPrinters, function (o) {
        return o._id == printers[i]._id;
      });

      //Check values for any changes, mark printers as requiring a rescan if so...
      if (
        farmPrinters[index].settingsAppearance.name !==
        printers[i].settingsAppearance.name
      ) {
        farmPrinters[index].settingsApperance.name =
          printers[i].settingsAppearance.name;
        farmPrinters[index].markModified("settingsApperance");
        logger.info(
          `Modified Current Name  for: ${farmPrinters[i].printerURL}`
        );
        if (!changes.includes(printers[i]._id)) {
          changes.push(printers[i]._id);
        }
      }
      if (farmPrinters[index].printerURL !== printers[i].printerURL) {
        if (printers[i].printerURL[printers[i].printerURL.length - 1] === "/") {
          printers[i].printerURL = printers[i].printerURL.replace(/\/?$/, "");
        }
        farmPrinters[index].printerURL = printers[i].printerURL;
        farmPrinters[index].markModified("printerURL");
        logger.info(
          `Modified current printer URL  for: ${farmPrinters[i].printerURL}`
        );
        if (!changes.includes(printers[i]._id)) {
          changes.push(printers[i]._id);
        }
      }
      if (farmPrinters[index].camURL !== printers[i].camURL) {
        farmPrinters[index].camURL = printers[i].camURL;
        farmPrinters[index].markModified("camURL");
        logger.info(
          `Modified current camera URL for: ${farmPrinters[i].printerURL}`
        );
        if (!changes.includes(printers[i]._id)) {
          changes.push(printers[i]._id);
        }
      }
      if (farmPrinters[index].apikey !== printers[i].apikey) {
        farmPrinters[index].apikey = printers[i].apikey;
        farmPrinters[index].markModified("apikey");
        logger.info(
          `Modified current APIKEY for: ${farmPrinters[i].printerURL}`
        );
        if (!changes.includes(printers[i]._id)) {
          changes.push(printers[i]._id);
        }
      }

      if (farmPrinters[index].group !== printers[i].group) {
        farmPrinters[index].group = printers[i].group;
        farmPrinters[index].markModified("group");
        logger.info(
          `Modified current group for: ${farmPrinters[index].printerURL}`
        );
        if (!changes.includes(printers[i]._id)) {
          changes.push(printers[i]._id);
        }
      }
    }
    Runner.updateGroupList();
    for (let x = 0; x < changes.length; x++) {
      const changeIndex = _.findIndex(farmPrinters, function (o) {
        return o._id == changes[x];
      });
      farmPrinters[changeIndex].state = "Searching...";
      farmPrinters[changeIndex].stateColour = Runner.getColour("Searching...");
      farmPrinters[changeIndex].hostState = "Searching...";
      farmPrinters[changeIndex].hostStateColour =
        Runner.getColour("Searching...");
      farmPrinters[changeIndex].webSocket = "danger";
      farmPrinters[changeIndex].stateDescription =
        "Re-Scanning your OctoPrint Instance";
      farmPrinters[changeIndex].hostDescription =
        "Re-Scanning for OctoPrint Host";
      farmPrinters[changeIndex].webSocketDescription = "Websocket is Offline";
      PrinterTicker.addIssue(
        new Date(),
        farmPrinters[changeIndex].printerURL,
        "Updating Printer information...",
        "Active",
        farmPrinters[changeIndex]._id
      );
      await this.reScanOcto(changes[x], true);
      if (changeIndex > -1) {
        const filter = { _id: farmPrinters[changeIndex]._id };
        const update = farmPrinters[changeIndex];
        await Printers.findOneAndUpdate(filter, update, {
          returnOriginal: false
        });
        if (typeof farmPrinters[changeIndex] !== "undefined") {
          PrinterClean.generate(farmPrinters[changeIndex]);
        }
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[changeIndex].printerURL,
          "Printer information updated successfully...",
          "Complete",
          farmPrinters[changeIndex]._id
        );
      }
    }
    logger.info("Re-Scanning printers farm");
    // Regenerate sort index on printer update...
    await this.reGenerateSortIndex();
    return changes;
  }

  static async trackCounters() {
    for (let p = 0; p < farmPrinters.length; p++) {
      if (typeof farmPrinters[p].stateColour !== "undefined") {
        if (farmPrinters[p].stateColour.category === "Active") {
          farmPrinters[p].currentActive = farmPrinters[p].currentActive + 30000;
        }
        if (
          farmPrinters[p].stateColour.category === "Idle" ||
          farmPrinters[p].stateColour.category === "Disconnected" ||
          farmPrinters[p].stateColour.category === "Complete"
        ) {
          farmPrinters[p].currentIdle = farmPrinters[p].currentIdle + 30000;
        }
        if (farmPrinters[p].stateColour.category === "Offline") {
          farmPrinters[p].currentOffline =
            farmPrinters[p].currentOffline + 30000;
        }
        farmPrinters[p]
          .save()
          .catch((e) =>
            logger.info("Error Saving Counters, Safe to ignore...", e)
          );
      }
    }
  }

  static async reGenerateSortIndex() {
    for (let p = 0; p < farmPrinters.length; p++) {
      await logger.info(
        `Regenerating existing indexes: ${farmPrinters[p].printerURL}`
      );
      PrinterTicker.addIssue(
        new Date(),
        farmPrinters[p].printerURL,
        `Regenerating Printer Index: ${p}`,
        "Active",
        farmPrinters[p]._id
      );
      farmPrinters[p].sortIndex = p;
      const filter = { _id: farmPrinters[p]._id };
      const update = { sortIndex: p };
      await Printers.findOneAndUpdate(filter, update, {
        returnOriginal: false
      });
    }
  }

  static async removePrinter(indexs) {
    logger.info("Pausing runners to remove printer...");
    await this.pause();
    let removed = [];
    if (indexs.length !== farmPrinters.length) {
      for (let i = 0; i < indexs.length; i++) {
        const index = _.findIndex(farmPrinters, function (o) {
          return o._id == indexs[i];
        });
        if (index > -1) {
          const removedURL = JSON.parse(
            JSON.stringify(farmPrinters[index].printerURL)
          );
          const removedIP = JSON.parse(JSON.stringify(farmPrinters[index]._id));
          logger.info(`Removing printer from database: ${removedIP}`);
          PrinterTicker.addIssue(
            new Date(),
            removedURL,
            "Removing printer from database...",
            "Active",
            removedIP
          );
          removed.push({
            printerURL: removedURL,
            printerId: removedIP
          });
          await Printers.findOneAndDelete({
            _id: removedIP
          });
          farmPrinters.splice(index, 1);
          PrinterTicker.addIssue(
            new Date(),
            removedURL,
            "Successfully removed from database...",
            "Complete",
            removedIP
          );
        }
      }

      // Regenerate Indexs
      for (let p = 0; p < farmPrinters.length; p++) {
        farmPrinters[p].state = "Resetting...";
        farmPrinters[p].stateColour = Runner.getColour("Searching...");
        farmPrinters[p].hostState = "Resetting...";
        farmPrinters[p].hostStateColour = Runner.getColour("Searching...");
        farmPrinters[p].webSocket = "danger";
        farmPrinters[p].stateDescription = "Attempting to connect to OctoPrint";
        farmPrinters[p].hostDescription = "Attempting to connect to OctoPrint";
        farmPrinters[p].webSocketDescription = "Websocket Offline";
        PrinterClean.generate(farmPrinters[p], systemSettings.filamentManager);
        await logger.info(
          `Regenerating existing indexes: ${farmPrinters[p].printerURL}`
        );
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[p].printerURL,
          `Regenerating Printer Index: ${p}`,
          "Active",
          farmPrinters[p]._id
        );
        farmPrinters[p].sortIndex = p;
        const filter = { _id: farmPrinters[p]._id };
        const update = { sortIndex: p };
        await Printers.findOneAndUpdate(filter, update, {
          returnOriginal: false
        });
      }
      //Reset PrintersInformation for reload
      farmPrinters = [];
      await PrinterClean.removePrintersInformation();
      logger.info("Re-Scanning printers farm");
      this.init();
    } else {
      for (let i = 0; i < indexs.length; i++) {
        removed.push({
          printerURL: "",
          printerId: indexs[i]
        });
      }
      farmPrinters = [];
      await PrinterClean.removePrintersInformation();
      await Printers.deleteMany({});
      logger.info("Re-Scanning printers farm");
      PrinterTicker.addIssue(
        new Date(),
        "All Printers",
        "Successfully removed from the database...",
        "Complete",
        ""
      );
      this.init();
    }
    return removed;
  }

  static async reScanOcto(id, skipAPI) {
    const index = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    const result = {
      status: null,
      msg: null
    };
    PrinterTicker.addIssue(
      new Date(),
      farmPrinters[index].printerURL,
      "ReScan Requested... checking socket state",
      "Active",
      farmPrinters[index]._id
    );
    farmPrinters[index].systemChecks.scanning.api.status = "warning";
    farmPrinters[index].systemChecks.scanning.files.status = "warning";
    farmPrinters[index].systemChecks.scanning.state.status = "warning";
    farmPrinters[index].systemChecks.scanning.profile.status = "warning";
    farmPrinters[index].systemChecks.scanning.settings.status = "warning";
    farmPrinters[index].systemChecks.scanning.system.status = "warning";

    farmPrinters[index].state = "Searching...";
    farmPrinters[index].stateColour = Runner.getColour("Searching...");
    farmPrinters[index].hostState = "Searching...";
    farmPrinters[index].hostStateColour = Runner.getColour("Searching...");
    farmPrinters[index].webSocket = "danger";
    farmPrinters[index].stateDescription =
      "Re-Scanning your OctoPrint Instance";
    farmPrinters[index].hostDescription = "Re-Scanning for OctoPrint Host";
    farmPrinters[index].webSocketDescription = "Websocket is Offline";
    PrinterClean.generate(farmPrinters[index], systemSettings.filamentManager);
    if (
      typeof farmPrinters[index].ws !== "undefined" &&
      typeof farmPrinters[index].ws.instance !== "undefined"
    ) {
      PrinterTicker.addIssue(
        new Date(),
        farmPrinters[index].printerURL,
        `Websocket state ${farmPrinters[index].ws.instance.readyState}`,
        "Active",
        farmPrinters[index]._id
      );
      if (farmPrinters[index].ws.instance.readyState === 1) {
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          "Socket currently active, closing and re-setting back up...",
          "Active",
          farmPrinters[index]._id
        );
        await farmPrinters[index].ws.instance.close();
        logger.info(
          `Closed websocket connection for: ${farmPrinters[index].printerURL}`
        );
        const { _id } = farmPrinters[index];
        await this.setupWebSocket(_id, skipAPI);
      } else if (farmPrinters[index].ws.instance.readyState === 2) {
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          "Socket in tentative state, awaiting for connection attempt to finish... retry in 2000ms",
          "Active",
          farmPrinters[index]._id
        );
        const { _id } = farmPrinters[index];
        farmPrinters[index].state = "Searching...";
        farmPrinters[index].stateColour = Runner.getColour("Searching...");
        farmPrinters[index].hostState = "Searching...";
        farmPrinters[index].hostStateColour = Runner.getColour("Searching...");
        farmPrinters[index].webSocket = "info";
        farmPrinters[index].stateDescription =
          "Re-Scanning your OctoPrint Instance";
        farmPrinters[index].hostDescription = "Re-Scanning for OctoPrint Host";
        farmPrinters[index].webSocketDescription =
          "Awaiting current websocket attempt to end...";
        PrinterClean.generate(
          farmPrinters[index],
          systemSettings.filamentManager
        );
        setTimeout(function () {
          PrinterTicker.addIssue(
            new Date(),
            farmPrinters[index].printerURL,
            "Retrying socket...",
            "Active",
            farmPrinters[index]._id
          );
          Runner.reScanOcto(_id, skipAPI);
        }, 2000);
      } else {
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          "Socket currently closed... Re-opening...",
          "Active",
          farmPrinters[index]._id
        );
        const { _id } = farmPrinters[index];
        await farmPrinters[index].ws.instance.close();
        await this.setupWebSocket(_id, skipAPI);
      }
    } else {
      PrinterTicker.addIssue(
        new Date(),
        farmPrinters[index].printerURL,
        "Socket currently closed... Re-opening...",
        "Active",
        farmPrinters[index]._id
      );
      const { _id } = farmPrinters[index];
      await this.setupWebSocket(_id, skipAPI);
    }
    result.status = "success";
    result.msg = "Your client has been re-synced!";
    return result;
  }

  static async updatePoll() {
    for (let i = 0; i < farmPrinters.length; i++) {
      // Update the server
      const server = await ServerSettings.check();
      systemSettings = server[0];
      const Polling = systemSettings.onlinePolling;
      const throt = {};
      logger.info(
        `Updating websock poll time: ${(Polling.seconds * 1000) / 500}`
      );
      throt.throttle = parseInt((Polling.seconds * 1000) / 500);
      if (
        typeof farmPrinters[i].ws !== "undefined" &&
        typeof farmPrinters[i].ws.instance !== "undefined"
      ) {
        await farmPrinters[i].ws.instance.terminate();
      }
    }
    return "updated";
  }

  static async pause() {
    for (let i = 0; i < farmPrinters.length; i++) {
      if (
        typeof farmPrinters[i].ws !== "undefined" &&
        typeof farmPrinters[i].ws.instance !== "undefined"
      ) {
        await farmPrinters[i].ws.instance.close();
        logger.info(
          `Closed websocket connection for: ${farmPrinters[i].printerURL}`
        );
      }
    }
    return true;
  }

  static async getFile(id, fullPath) {
    const index = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });

    const printer = farmPrinters[index];
    const getFileInformation = await this.octoPrintService.getFile(
      printer,
      fullPath
    );
    const getJson = await getFileInformation.json();

    let timeStat = null;
    let filament = [];
    const entry = getJson;
    if (typeof entry.gcodeAnalysis !== "undefined") {
      if (typeof entry.gcodeAnalysis.estimatedPrintTime !== "undefined") {
        timeStat = entry.gcodeAnalysis.estimatedPrintTime;
        // Start collecting multiple tool lengths and information from files....
        Object.keys(entry.gcodeAnalysis.filament).forEach(function (item, i) {
          filament[i] = entry.gcodeAnalysis.filament[item].length;
        });
      } else {
        timeStat = "No Time Estimate";
        filament = null;
      }
    } else {
      timeStat = "No Time Estimate";
      filament = null;
    }
    let path = null;
    if (entry.path.indexOf("/") > -1) {
      path = entry.path.substr(0, entry.path.lastIndexOf("/"));
    } else {
      path = "local";
    }
    let thumbnail = null;

    if (typeof entry.thumbnail !== "undefined") {
      thumbnail = entry.thumbnail;
    }

    let success = 0;
    let failed = 0;
    let last = null;

    if (typeof entry.prints !== "undefined") {
      success = entry.prints.success;
      failed = entry.prints.failure;
      last = entry.prints.last.success;
    }

    return {
      path,
      fullPath: entry.path,
      display: entry.display,
      length: filament,
      name: entry.name,
      size: entry.size,
      time: timeStat,
      date: entry.date,
      thumbnail,
      success: success,
      failed: failed,
      last: last
    };
  }

  static async getFiles(id, recursive) {
    const index = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    farmPrinters[index].systemChecks.scanning.files.status = "warning";
    // Shim to fix undefined on upload files/folders
    farmPrinters[index].fileList = {
      files: [],
      fileCount: 0,
      folders: [],
      folderCount: 0
    };
    PrinterTicker.addIssue(
      new Date(),
      farmPrinters[index].printerURL,
      "Grabbing file information...",
      "Active",
      farmPrinters[index]._id
    );
    const printer = farmPrinters[index];

    return await this.octoPrintService
      .getFiles(printer, recursive)
      .then((res) => {
        return res.json();
      })
      .then(async (res) => {
        // Setup the files json storage object
        farmPrinters[index].storage = {
          free: res.free,
          total: res.total
        };
        farmPrinters[index].markModified("storage");
        // Setup the files location object to place files...
        const printerFiles = [];
        const printerLocations = [];
        const recursivelyPrintNames = async function (entry, depth) {
          // eslint-disable-next-line no-param-reassign
          depth = depth || 0;
          let timeStat = "";
          let filament = [];
          const isFolder = entry.type === "folder";
          if (!isFolder) {
            if (typeof entry.gcodeAnalysis !== "undefined") {
              if (
                typeof entry.gcodeAnalysis.estimatedPrintTime !== "undefined"
              ) {
                timeStat = entry.gcodeAnalysis.estimatedPrintTime;
                // Start collecting multiple tool lengths and information from files....
                Object.keys(entry.gcodeAnalysis.filament).forEach(function (
                  item,
                  i
                ) {
                  filament[i] = entry.gcodeAnalysis.filament[item].length;
                });
              } else {
                timeStat = "No Time Estimate";
                filament = null;
              }
            } else {
              timeStat = "No Time Estimate";
              filament = null;
            }

            let path = null;
            if (entry.path.indexOf("/") > -1) {
              path = entry.path.substr(0, entry.path.lastIndexOf("/"));
            } else {
              path = "local";
            }
            let thumbnail = null;

            if (typeof entry.thumbnail !== "undefined") {
              thumbnail = entry.thumbnail;
            }

            let success = 0;
            let failed = 0;
            let last = null;

            if (typeof entry.prints !== "undefined") {
              success = entry.prints.success;
              failed = entry.prints.failure;
              last = entry.prints.last.success;
            }

            const file = {
              path,
              fullPath: entry.path,
              display: entry.display,
              length: filament,
              name: entry.name,
              size: entry.size,
              time: timeStat,
              date: entry.date,
              thumbnail,
              success: success,
              failed: failed,
              last: last
            };
            printerFiles.push(file);
          }

          const folderPaths = {
            name: "",
            path: ""
          };
          if (isFolder) {
            if (entry.path.indexOf("/") > -1) {
              folderPaths.path = entry.path.substr(
                0,
                entry.path.lastIndexOf("/")
              );
            } else {
              folderPaths.path = "local";
            }

            if (entry.path.indexOf("/")) {
              folderPaths.name = entry.path;
            } else {
              folderPaths.name = entry.path.substr(
                0,
                entry.path.lastIndexOf("/")
              );
            }
            folderPaths.display = folderPaths.name.replace("/_/g", " ");
            printerLocations.push(folderPaths);
          }

          if (isFolder) {
            _.each(entry.children, function (child) {
              recursivelyPrintNames(child, depth + 1);
            });
          }
        };

        _.each(res.files, function (entry) {
          recursivelyPrintNames(entry);
        });
        farmPrinters[index].fileList = {
          files: printerFiles,
          fileCount: printerFiles.length,
          folders: printerLocations,
          folderCount: printerLocations.length
        };
        farmPrinters[index].markModified("fileList");
        const currentFilament = await Runner.compileSelectedFilament(
          farmPrinters[index].selectedFilament,
          index
        );
        FileClean.generate(farmPrinters[index], currentFilament);
        farmPrinters[index].systemChecks.scanning.files.status = "success";
        farmPrinters[index].systemChecks.scanning.files.date = new Date();
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          "Grabbed file information...",
          "Complete",
          farmPrinters[index]._id
        );
        FileClean.statistics(farmPrinters);
        logger.info(
          `Successfully grabbed Files for...: ${farmPrinters[index].printerURL}`
        );
        return true;
      })
      .catch((err) => {
        farmPrinters[index].systemChecks.scanning.files.status = "danger";
        farmPrinters[index].systemChecks.scanning.files.date = new Date();
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          `Error grabbing file information: ${err}`,
          "Disconnected",
          farmPrinters[index]._id
        );
        logger.error(
          `Error grabbing files for: ${farmPrinters[index].printerURL}: Reason: `,
          err
        );
        return false;
      });
  }

  static getState(id) {
    const index = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    farmPrinters[index].systemChecks.scanning.state.status = "warning";
    PrinterTicker.addIssue(
      new Date(),
      farmPrinters[index].printerURL,
      "Grabbing state information...",
      "Active",
      farmPrinters[index]._id
    );
    return this.octoPrintService
      .getConnection(farmPrinters[index], true)
      .then((res) => {
        return res.json();
      })
      .then(async (res) => {
        // Update info to DB
        if (res.current.state === "Offline") {
          res.current.state = "Disconnected";
          farmPrinters[index].stateDescription = "Your printer is disconnected";
        } else if (res.current.state.includes("Error:")) {
          farmPrinters[index].stateDescription = res.current.state;
          res.current.state = "Error!";
        } else if (res.current.state === "Closed") {
          res.current.state = "Disconnected";
          farmPrinters[index].stateDescription = "Your printer is disconnected";
        } else {
          farmPrinters[index].stateDescription =
            "Current Status from OctoPrint";
        }
        farmPrinters[index].current = res.current;
        farmPrinters[index].options = res.options;
        farmPrinters[index].job = null;
        farmPrinters[index].systemChecks.scanning.state.status = "success";
        farmPrinters[index].systemChecks.scanning.state.date = new Date();
        const currentFilament = JSON.parse(
          JSON.stringify(farmPrinters[index].selectedFilament)
        );
        for (let s = 0; s < farmPrinters[index].selectedFilament.length; s++) {
          if (farmPrinters[index].selectedFilament[s] !== null) {
            const profile = null;
            // if (systemSettings.filamentManager) {
            //   profile = await Profiles.findOne({
            //     "profile.index":
            //       farmPrinters[index].selectedFilament[s].spools.profile,
            //   });
            // } else {
            //   profile = await Profiles.findById(
            //     farmPrinters[index].selectedFilament[s].spools.profile
            //   );
            // }
            // currentFilament[s].spools.profile = profile.profile;
          }
        }
        JobClean.generate(farmPrinters[index], currentFilament);
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          "Grabbed state information...",
          "Complete",
          farmPrinters[index]._id
        );
        logger.info(
          `Successfully grabbed Current State for...: ${farmPrinters[index].printerURL}`
        );
      })
      .catch((err) => {
        farmPrinters[index].systemChecks.scanning.state.status = "danger";
        farmPrinters[index].systemChecks.scanning.state.date = new Date();
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          `Error grabbing state information: ${err}`,
          "Disconnected",
          farmPrinters[index]._id
        );
        logger.error(
          `Error grabbing state for: ${farmPrinters[index].printerURL} Reason: `,
          err
        );
        return false;
      });
  }

  static getProfile(id) {
    const index = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    farmPrinters[index].systemChecks.scanning.profile.status = "warning";
    PrinterTicker.addIssue(
      new Date(),
      farmPrinters[index].printerURL,
      "Grabbing profile information...",
      "Active",
      farmPrinters[index]._id
    );
    return this.octoPrintService
      .getPrinterProfiles(farmPrinters[index], true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        // Update info to DB
        farmPrinters[index].profiles = res.profiles;
        farmPrinters[index].systemChecks.scanning.profile.status = "success";
        farmPrinters[index].systemChecks.scanning.profile.date = new Date();
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          "Grabbed profile information...",
          "Complete",
          farmPrinters[index]._id
        );
        logger.info(
          `Successfully grabbed Profiles.js for...: ${farmPrinters[index].printerURL}`
        );
      })
      .catch((err) => {
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          `Error grabbing profile information: ${err}`,
          "Disconnected",
          farmPrinters[index]._id
        );
        farmPrinters[index].systemChecks.scanning.profile.status = "danger";
        farmPrinters[index].systemChecks.scanning.profile.date = new Date();
        logger.error(
          `Error grabbing profile for: ${farmPrinters[index].printerURL}: Reason: `,
          err
        );
        return false;
      });
  }

  static getPluginList(id) {
    const index = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    if (softwareUpdateChecker.getUpdateNotificationIfAny().air_gapped) {
      PrinterTicker.addIssue(
        new Date(),
        farmPrinters[index].printerURL,
        `Farm is air gapped, skipping OctoPrint plugin list request`,
        "Active",
        farmPrinters[index]._id
      );
      return false;
    }

    farmPrinters[index].pluginsList = [];
    PrinterTicker.addIssue(
      new Date(),
      farmPrinters[index].printerURL,
      "Grabbing plugin list",
      "Active",
      farmPrinters[index]._id
    );

    return this.octoPrintService
      .getPluginManager(farmPrinters[index], true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        farmPrinters[index].pluginsList = res.repository.plugins;
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          `Grabbed plugin list (OctoPrint compatibility: ${farmPrinters[index].octoPrintVersion})`,
          "Complete",
          farmPrinters[index]._id
        );
      })
      .catch((err) => {
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          `Error grabbing plugin list information: ${err}`,
          "Disconnected",
          farmPrinters[index]._id
        );
        logger.error(
          `Error grabbing plugin list for: ${farmPrinters[index].printerURL}: Reason: `,
          err
        );
        return false;
      });
  }

  static getOctoPrintSystenInfo(id) {
    const index = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    farmPrinters[index].octoPrintSystemInfo = {};
    PrinterTicker.addIssue(
      new Date(),
      farmPrinters[index].printerURL,
      "Grabbing OctoPrint's System Information",
      "Active",
      farmPrinters[index]._id
    );
    return this.octoPrintService
      .getSystemInfo(farmPrinters[index], true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        farmPrinters[index].octoPrintSystemInfo = res.systeminfo;
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          "Grabbed OctoPrints System Info",
          "Complete",
          farmPrinters[index]._id
        );
      })
      .catch((err) => {
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          `Error grabbing system information: ${err}`,
          "Disconnected",
          farmPrinters[index]._id
        );
        farmPrinters[index].systemChecks.scanning.profile.status = "danger";
        farmPrinters[index].systemChecks.scanning.profile.date = new Date();
        logger.error(
          `Error grabbing system for: ${farmPrinters[index].printerURL}: Reason: `,
          err
        );
        return false;
      });
  }

  static getUpdates(id, force = false) {
    const index = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    if (softwareUpdateChecker.getUpdateNotificationIfAny().air_gapped) {
      PrinterTicker.addIssue(
        new Date(),
        farmPrinters[index].printerURL,
        `Farm is air gapped, skipping OctoPrint updates request`,
        "Active",
        farmPrinters[index]._id
      );
      return false;
    }
    farmPrinters[index].octoPrintUpdate = [];
    farmPrinters[index].octoPrintPluginUpdates = [];

    PrinterTicker.addIssue(
      new Date(),
      farmPrinters[index].printerURL,
      "Checking OctoPrint for updates...",
      "Active",
      farmPrinters[index]._id
    );

    return this.octoPrintService
      .getSoftwareUpdateCheck(farmPrinters[index], force, true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        let octoPrintUpdate = false;
        let pluginUpdates = [];
        for (var key in res.information) {
          if (res.information.hasOwnProperty(key)) {
            if (res.information[key].updateAvailable) {
              if (key === "octoprint") {
                octoPrintUpdate = {
                  id: key,
                  displayName: res.information[key].displayName,
                  displayVersion: res.information[key].displayVersion,
                  updateAvailable: res.information[key].updateAvailable,
                  releaseNotesURL: res.information[key].releaseNotes
                };
              } else {
                pluginUpdates.push({
                  id: key,
                  displayName: res.information[key].displayName,
                  displayVersion: res.information[key].displayVersion,
                  updateAvailable: res.information[key].updateAvailable,
                  releaseNotesURL: res.information[key].releaseNotes
                });
              }
            }
          }
        }
        farmPrinters[index].octoPrintUpdate = octoPrintUpdate;
        farmPrinters[index].octoPrintPluginUpdates = pluginUpdates;

        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          "Octoprints checked for updates...",
          "Complete",
          farmPrinters[index]._id
        );
      })
      .catch((err) => {
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          `Error grabbing octoprint updates information: ${err}`,
          "Disconnected",
          farmPrinters[index]._id
        );
        logger.error(
          `Error grabbing octoprint updates for: ${farmPrinters[index].printerURL}: Reason: `,
          err
        );
        return false;
      });
  }

  static async killPowerSettings(printerID) {
    try {
      const index = _.findIndex(farmPrinters, function (o) {
        return o._id == printerID;
      });
      farmPrinters[index].powerSettings = {
        powerOnCommand: "",
        powerOnURL: "",
        powerOffCommand: "",
        powerOffURL: "",
        powerToggleCommand: "",
        powerToggleURL: "",
        powerStatusCommand: "",
        powerStatusURL: "",
        wol: {
          enabled: farmPrinters[index].powerSettings.wol.enabled,
          ip: farmPrinters[index].powerSettings.wol.ip,
          packets: farmPrinters[index].powerSettings.wol.packets,
          port: farmPrinters[index].powerSettings.wol.port,
          interval: farmPrinters[index].powerSettings.wol.interval,
          MAC: farmPrinters[index].powerSettings.wol.MAC
        }
      };
      const printer = await Printers.findById(farmPrinters[index]._id);
      printer.powerSettings = farmPrinters[index].powerSettings;
      printer.save();
      return true;
    } catch (e) {
      return false;
    }
  }

  static async getSettings(id) {
    const index = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    farmPrinters[index].systemChecks.scanning.settings.status = "warning";
    PrinterTicker.addIssue(
      new Date(),
      farmPrinters[index].printerURL,
      "Grabbing settings information...",
      "Active",
      farmPrinters[index]._id
    );
    return this.octoPrintService
      .getSettings(farmPrinters[index], true)
      .then((res) => {
        return res.json();
      })
      .then(async (res) => {
        // Update info to DB
        farmPrinters[index].corsCheck = res.api.allowCrossOrigin;
        farmPrinters[index].settingsApi = res.api;
        if (!farmPrinters[index].settingsAppearance) {
          farmPrinters[index].settingsAppearance = res.appearance;
        } else if (farmPrinters[index].settingsAppearance.name === "") {
          farmPrinters[index].settingsAppearance.name = res.appearance.name;
        }
        if (res.plugins["pi_support"]) {
          PrinterTicker.addIssue(
            new Date(),
            farmPrinters[index].printerURL,
            "Pi Plugin detected... scanning for version information...",
            "Active",
            farmPrinters[index]._id
          );

          let piSupport = await this.octoPrintService.getPluginPiSupport(
            farmPrinters[index]
          );
          piSupport = await piSupport.json();

          farmPrinters[index].octoPi = {
            model: piSupport.model,
            version: piSupport.octopi_version
          };

          PrinterTicker.addIssue(
            new Date(),
            farmPrinters[index].printerURL,
            "Sucessfully grabbed OctoPi information...",
            "Complete",
            farmPrinters[index]._id
          );
        }
        if (res.plugins["costestimation"]) {
          if (
            _.isEmpty(farmPrinters[index].costSettings) ||
            farmPrinters[index].costSettings.powerConsumption === 0.5
          ) {
            PrinterTicker.addIssue(
              new Date(),
              farmPrinters[index].printerURL,
              "Cost Plugin detected... Updating OctoFarms Cost settings",
              "Active",
              farmPrinters[index]._id
            );
            farmPrinters[index].costSettings = {
              powerConsumption: res.plugins["costestimation"].powerConsumption,
              electricityCosts: res.plugins["costestimation"].costOfElectricity,
              purchasePrice: res.plugins["costestimation"].priceOfPrinter,
              estimateLifespan: res.plugins["costestimation"].lifespanOfPrinter,
              maintenanceCosts: res.plugins["costestimation"].maintenanceCosts
            };
            const printer = await Printers.findById(id);

            await printer.save();
            PrinterTicker.addIssue(
              new Date(),
              farmPrinters[index].printerURL,
              "Successfully saved Cost Estimation settings",
              "Complete",
              farmPrinters[index]._id
            );
          }
        }

        if (res.plugins["psucontrol"]) {
          if (
            _.isEmpty(farmPrinters[index].powerSettings) &&
            farmPrinters[index].powerSettings.powerOffCommand === ""
          ) {
            PrinterTicker.addIssue(
              new Date(),
              farmPrinters[index].printerURL,
              "PSU Control plugin detected... Updating OctoFarm power settings...",
              "Active",
              farmPrinters[index]._id
            );
            farmPrinters[index].powerSettings = {
              powerOnCommand: '{"command":"turnPSUOn"}',
              powerOnURL: "[PrinterURL]/api/plugin/psucontrol",
              powerOffCommand: '{"command":"turnPSUOff"}',
              powerOffURL: "[PrinterURL]/api/plugin/psucontrol",
              powerToggleCommand: '{"command":"togglePSU"}',
              powerToggleURL: "[PrinterURL]/api/plugin/psucontrol",
              powerStatusCommand: '{"command":"getPSUState"}',
              powerStatusURL: "[PrinterURL]/api/plugin/psucontrol",
              wol: {
                enabled: false,
                ip: "255.255.255.0",
                packets: "3",
                port: "9",
                interval: "100",
                MAC: ""
              }
            };
            const printer = await Printers.findById(id);

            await printer.save();
            PrinterTicker.addIssue(
              new Date(),
              farmPrinters[index].printerURL,
              "Successfully saved PSU control settings...",
              "Complete",
              farmPrinters[index]._id
            );
          }
        }
        farmPrinters[index].settingsFeature = res.feature;
        farmPrinters[index].settingsFolder = res.folder;
        farmPrinters[index].settingsPlugins = res.plugins;
        farmPrinters[index].settingsScripts = res.scripts;
        farmPrinters[index].settingsSerial = res.serial;
        farmPrinters[index].settingsServer = res.server;
        farmPrinters[index].settingsSystem = res.system;
        farmPrinters[index].settingsWebcam = res.webcam;
        if (farmPrinters[index].camURL === "") {
          if (
            typeof res.webcam !== "undefined" &&
            typeof res.webcam.streamUrl !== "undefined" &&
            res.webcam.streamUrl != null
          ) {
            if (res.webcam.streamUrl.includes("http")) {
              farmPrinters[index].camURL = res.webcam.streamUrl;
            } else {
              farmPrinters[index].camURL =
                farmPrinters[index].printerURL + res.webcam.streamUrl;
            }
            const printer = await Printers.findById(id);
            printer.camURL = farmPrinters[index].camURL;
            await printer.save();
          }
        }

        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          "Grabbed settings information...",
          "Complete",
          farmPrinters[index]._id
        );

        farmPrinters[index].systemChecks.scanning.settings.status = "success";
        farmPrinters[index].systemChecks.scanning.settings.date = new Date();
        logger.info(
          `Successfully grabbed Settings for...: ${farmPrinters[index].printerURL}`
        );
      })
      .catch((err) => {
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          `Error grabbing settings information: ${err}`,
          "Offline",
          farmPrinters[index]._id
        );
        farmPrinters[index].systemChecks.scanning.settings.status = "danger";
        farmPrinters[index].systemChecks.scanning.settings.date = new Date();
        logger.error(
          `Error grabbing settings for: ${farmPrinters[index].printerURL}: Reason: `,
          err
        );
        return false;
      });
  }

  static getSystem(id) {
    const index = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    farmPrinters[index].systemChecks.scanning.system.status = "warning";
    PrinterTicker.addIssue(
      new Date(),
      farmPrinters[index].printerURL,
      "Grabbing system information...",
      "Active",
      farmPrinters[index]._id
    );
    return this.octoPrintService
      .getSystemCommands(farmPrinters[index], true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        // Update info to DB
        farmPrinters[index].core = res.core;
        farmPrinters[index].systemChecks.scanning.system.status = "success";
        farmPrinters[index].systemChecks.scanning.system.date = new Date();
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          "Grabbed system information...",
          "Complete",
          farmPrinters[index]._id
        );

        logger.info(
          `Successfully grabbed System Information for...: ${farmPrinters[index].printerURL}`
        );
      })
      .catch((err) => {
        PrinterTicker.addIssue(
          new Date(),
          farmPrinters[index].printerURL,
          `Error grabbing system information: ${err}`,
          "Offline",
          farmPrinters[index]._id
        );
        farmPrinters[index].systemChecks.scanning.system.status = "danger";
        farmPrinters[index].systemChecks.scanning.system.date = new Date();
        logger.error(
          `Error grabbing system for: ${farmPrinters[index].printerURL}: Reason: `,
          err
        );
        return false;
      });
  }

  // Patch for updating OctoPrint's settings for now until re-work of printer cache with state.js.
  static async getLatestOctoPrintSettingsValues(id) {
    const index = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    // This was causing slowdown of settings pages when loading, we should only be running this command when printer is considered online.
    if (farmPrinters[index].state !== "Offline") {
      // This is why the settings we're not updating! Forgot that connection options and preferences come in state, not settings/system.
      await Runner.getState(id);
      // Update the printers cached settings from OctoPrint
      await Runner.getSettings(id);
      // Update the printers cached system settings from OctoPrint
      await Runner.getSystem(id);
      // Re-generate the printer clean information - This is just cautionary, my tests showed it wasn't needed.
    }

    await PrinterClean.generate(
      farmPrinters[index],
      systemSettings.filamentManager
    );
  }

  static getColour(state) {
    if (state === "Operational") {
      return { name: "secondary", hex: "#262626", category: "Idle" };
    }
    if (state === "Paused") {
      return { name: "warning", hex: "#583c0e", category: "Idle" };
    }
    if (state === "Printing") {
      return { name: "warning", hex: "#583c0e", category: "Active" };
    }
    if (state === "Pausing") {
      return { name: "warning", hex: "#583c0e", category: "Active" };
    }
    if (state === "Cancelling") {
      return { name: "warning", hex: "#583c0e", category: "Active" };
    }
    if (state === "Starting") {
      return { name: "warning", hex: "#583c0e", category: "Active" };
    }
    if (state === "Error!") {
      return { name: "danger", hex: "#2e0905", category: "Error!" };
    }
    if (state === "Offline") {
      return { name: "danger", hex: "#2e0905", category: "Offline" };
    }
    if (state === "Searching...") {
      return { name: "danger", hex: "#2e0905", category: "Offline" };
    }
    if (state === "Disconnected") {
      return { name: "danger", hex: "#2e0905", category: "Disconnected" };
    }
    if (state === "No-API") {
      return { name: "danger", hex: "#2e0905", category: "Offline" };
    }
    if (state === "Complete") {
      return { name: "success", hex: "#00330e", category: "Complete" };
    }
    if (state === "Shutdown") {
      return { name: "danger", hex: "#2e0905", category: "Offline" };
    }
    if (state === "Online") {
      return { name: "success", hex: "#00330e", category: "Idle" };
    }
    if (state === "Offline after error") {
      return { name: "danger", hex: "#2e0905", category: "Error!" };
    }
    return { name: "warning", hex: "#583c0e", category: "Active" };
  }

  static returnFarmPrinters(index) {
    if (typeof index === "undefined") {
      return farmPrinters;
    }
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == index;
    });
    return farmPrinters[i];
  }

  static async removeFile(printer, fullPath) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == printer._id;
    });
    const index = await _.findIndex(
      farmPrinters[i].fileList.files,
      function (o) {
        return o.fullPath === fullPath;
      }
    );
    farmPrinters[i].fileList.files.splice(index, 1);
    farmPrinters[i].fileList.fileCount = farmPrinters[i].fileList.files.length;
    farmPrinters[i].markModified("fileList");
    farmPrinters[i].save();
    const currentFilament = await Runner.compileSelectedFilament(
      farmPrinters[i].selectedFilament,
      i
    );
    FileClean.generate(farmPrinters[i], currentFilament);
    FileClean.statistics(farmPrinters);
  }

  static async compileSelectedFilament(selectedFilament, i) {
    const currentFilament = JSON.parse(JSON.stringify(selectedFilament));
    for (let s = 0; s < selectedFilament.length; s++) {
      if (selectedFilament[s] !== null) {
        let profile = null;
        try {
          if (systemSettings.filamentManager) {
            profile = await Profiles.findOne({
              "profile.index": selectedFilament[s].spools.profile
            });
          } else {
            profile = await Profiles.findById(
              selectedFilament[s].spools.profile
            );
          }
          currentFilament[s].spools.profile = profile.profile;
          farmPrinters[i].selectedFilament[s].spools.material =
            profile.profile.material;
        } catch (e) {
          logger.error("Couldn't find profile", e);
        }
      }
    }
    return currentFilament;
  }

  static async reSyncFile(id, fullPath) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    const fileID = _.findIndex(farmPrinters[i].fileList.files, function (o) {
      return o.fullPath == fullPath;
    });
    // Doesn't actually resync just the file... shhh
    farmPrinters[i].fileList.files[fileID] = await Runner.getFile(id, fullPath);
    farmPrinters[i].markModified("fileList");
    farmPrinters[i].save();
    const currentFilament = await Runner.compileSelectedFilament(
      farmPrinters[i].selectedFilament,
      i
    );
    FileClean.generate(farmPrinters[i], currentFilament);
    FileClean.statistics(farmPrinters);

    return true;
  }

  static async flowRate(id, newRate) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    farmPrinters[i].flowRate = newRate;
    const printer = await Printers.findById(id);
    printer.flowRate = farmPrinters[i].flowRate;
    printer.save();
    PrinterClean.generate(farmPrinters[i], systemSettings.filamentManager);
  }

  static async feedRate(id, newRate) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    farmPrinters[i].feedRate = newRate;
    const printer = await Printers.findById(id);
    printer.feedRate = farmPrinters[i].feedRate;
    printer.save();
    PrinterClean.generate(farmPrinters[i], systemSettings.filamentManager);
  }

  static async updateSortIndex(list) {
    // Update the live information
    for (let i = 0; i < farmPrinters.length; i++) {
      const id = _.findIndex(farmPrinters, function (o) {
        return JSON.stringify(o._id) === JSON.stringify(list[i]);
      });

      farmPrinters[id].sortIndex = i;
      PrinterClean.generate(farmPrinters[id], systemSettings.filamentManager);
      const printer = await Printers.findById(list[i]);
      printer.sortIndex = i;
      printer.save();
      PrinterClean.generate(farmPrinters[i], systemSettings.filamentManager);
    }
  }

  static stepRate(id, newRate) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    farmPrinters[i].stepRate = newRate;
    PrinterClean.generate(farmPrinters[i], systemSettings.filamentManager);
  }

  static async updateSettings(settings) {
    function difference(object, base) {
      function changes(object, base) {
        try {
          return _.transform(object, function (result, value, key) {
            if (!_.isEqual(value, base[key])) {
              result[key] =
                _.isObject(value) && _.isObject(base[key])
                  ? changes(value, base[key])
                  : value;
            }
          });
        } catch (e) {
          logger.error("Error detecting changes", e);
        }
      }

      try {
        return changes(object, base);
      } catch (e) {
        logger.error("Error detecting changes", e);
      }
    }

    try {
      const printer = await Printers.findById(settings.printer.index);
      const index = _.findIndex(farmPrinters, function (o) {
        return o._id == settings.printer.index;
      });
      let updatePrinter = false;
      if (
        settings.printer.printerName !== "" &&
        settings.printer.printerName !==
          farmPrinters[index].settingsAppearance.name
      ) {
        farmPrinters[index].settingsAppearance.name =
          settings.printer.printerName;
        printer.settingsAppearance.name = settings.printer.printerName;
        printer.markModified("settingsApperance");
        updatePrinter = true;
      }
      let profile = {};
      let sett = {};
      profile.status = 900;
      sett.status = 900;
      if (
        settings.printer.printerURL !== "" &&
        settings.printer.printerURL !== farmPrinters[index].printerURL
      ) {
        farmPrinters[index].printerURL = settings.printer.printerURL;
        printer.printerURL = settings.printer.printerURL;
        printer.markModified("printerURL");
        updatePrinter = true;
      }

      const currentWebSocketURL = new URL(farmPrinters[index].webSocketURL);
      if (
        settings.printer.webSocketProtocol !==
        currentWebSocketURL.protocol + "//"
      ) {
        // If we detect q difference then rebuild the websocket URL and mark for scan.
        printer.webSocketURL =
          settings.printer.webSocketProtocol + currentWebSocketURL.host;
        farmPrinters[index].webSocketURL =
          settings.printer.webSocketProtocol + currentWebSocketURL.host;
        printer.markModified("webSocketURL");
        updatePrinter = true;
      }
      if (
        settings.printer.cameraURL !== "" &&
        settings.printer.cameraURL !== farmPrinters[index].camURL
      ) {
        farmPrinters[index].camURL = settings.printer.cameraURL;
        printer.camURL = settings.printer.cameraURL;
        printer.markModified("camURL");
      }
      // Moved the update printer before the API print calls as it was causing errors to be caught in the api calls when offline... This was why it wasn't updating I believe as it was never firing the rescan code due to the catch.
      if (
        settings.printer.apikey !== "" &&
        settings.printer.apikey !== farmPrinters[index].apikey
      ) {
        farmPrinters[index].apikey = settings.printer.apikey;
        printer.apikey = settings.printer.apikey;
        printer.markModified("apikey");
        updatePrinter = true;
      }

      // Make sure OctoPrint status is updated before continuing on with settings...
      if (updatePrinter) {
        await Runner.reScanOcto(farmPrinters[index]._id, false);
      }

      // Update the baudrate preferences.
      // This would also currently need silly blank checking in place due to the client. Will sort in the refactor.
      // TODO: Update this mechanism in the refactor... and the rest XD
      farmPrinters[index].options = {
        baudratePreference: settings.connection.preferredBaud,
        portPreference: settings.connection.preferredPort,
        printerProfilePreference: settings.connection.preferredProfile
      };

      if (
        typeof settings.other !== "undefined" &&
        settings.other.coolDown != ""
      ) {
        farmPrinters[index].tempTriggers.coolDown = parseInt(
          settings.other.coolDown
        );
        printer.tempTriggers.coolDown = parseInt(settings.other.coolDown);
        printer.markModified("tempTriggers");
      }
      if (
        typeof settings.other !== "undefined" &&
        settings.other.heatingVariation != ""
      ) {
        farmPrinters[index].tempTriggers.heatingVariation = parseFloat(
          settings.other.heatingVariation
        );
        printer.tempTriggers.heatingVariation = parseFloat(
          settings.other.heatingVariation
        );
        printer.markModified("tempTriggers");
      }
      for (const key in settings.costSettings) {
        if (!_.isNull(settings.costSettings[key])) {
          farmPrinters[index].costSettings[key] = settings.costSettings[key];
          printer.costSettings[key] = settings.costSettings[key];
        }
      }

      printer.markModified("costSettings");
      let differences = difference(
        settings.costSettings,
        farmPrinters[index].costSettings
      );

      for (const key in differences) {
        if (differences[key] !== null && differences[key] !== "") {
          farmPrinters[index].costSettings[key] = differences[key];
          printer.costSettings[key] = differences[key];
        }
      }

      if (
        settings.powerCommands.powerOnCommand !== "" &&
        settings.powerCommands.powerOnCommand !==
          farmPrinters[index].powerSettings.powerOnCommand
      ) {
        farmPrinters[index].powerSettings.powerOnCommand =
          settings.powerCommands.powerOnCommand;
        printer.powerSettings.powerOnCommand =
          settings.powerCommands.powerOnCommand;
      }
      if (
        settings.powerCommands.powerOnURL !== "" &&
        settings.powerCommands.powerOnURL !==
          farmPrinters[index].powerSettings.powerOnURL
      ) {
        farmPrinters[index].powerSettings.powerOnURL =
          settings.powerCommands.powerOnURL;
        printer.powerSettings.powerOnURL = settings.powerCommands.powerOnURL;
      }
      if (
        settings.powerCommands.powerOffCommand !== "" &&
        settings.powerCommands.powerOffCommand !==
          farmPrinters[index].powerSettings.powerOffCommand
      ) {
        farmPrinters[index].powerSettings.powerOffCommand =
          settings.powerCommands.powerOffCommand;
        printer.powerSettings.powerOffCommand =
          settings.powerCommands.powerOffCommand;
      }
      if (
        settings.powerCommands.powerOffURL !== "" &&
        settings.powerCommands.powerOffURL !==
          farmPrinters[index].powerSettings.powerOffURL
      ) {
        printer.powerSettings.powerOffURL = settings.powerCommands.powerOffURL;
        farmPrinters[index].powerSettings.powerOffURL =
          settings.powerCommands.powerOffURL;
      }
      if (
        settings.powerCommands.powerToggleCommand !== "" &&
        settings.powerCommands.powerToggleCommand !==
          farmPrinters[index].powerSettings.powerToggleCommand
      ) {
        printer.powerSettings.powerToggleCommand =
          settings.powerCommands.powerToggleCommand;
        farmPrinters[index].powerSettings.powerToggleCommand =
          settings.powerCommands.powerToggleCommand;
      }
      if (
        settings.powerCommands.powerToggleURL !== "" &&
        settings.powerCommands.powerToggleURL !==
          farmPrinters[index].powerSettings.powerToggleURL
      ) {
        printer.powerSettings.powerToggleURL =
          settings.powerCommands.powerToggleURL;
        farmPrinters[index].powerSettings.powerToggleURL =
          settings.powerCommands.powerToggleURL;
      }
      if (
        settings.powerCommands.powerStatusCommand !== "" &&
        settings.powerCommands.powerStatusCommand !==
          farmPrinters[index].powerSettings.powerStatusCommand
      ) {
        farmPrinters[index].powerSettings.powerStatusCommand =
          settings.powerCommands.powerStatusCommand;
        printer.powerSettings.powerStatusCommand =
          settings.powerCommands.powerStatusCommand;
      }
      if (
        settings.powerCommands.powerStatusURL !== "" &&
        settings.powerCommands.powerStatusURL !==
          farmPrinters[index].powerSettings.powerStatusURL
      ) {
        farmPrinters[index].powerSettings.powerStatusURL =
          settings.powerCommands.powerStatusURL;
        printer.powerSettings.powerStatusURL =
          settings.powerCommands.powerStatusURL;
      }
      if (settings.powerCommands.wol.enabled) {
        farmPrinters[index].powerSettings.wol = settings.powerCommands.wol;
      }

      printer.markModified("powerSettings");

      if (settings.systemCommands.serverRestart !== "") {
        farmPrinters[index].settingsServer.commands.serverRestartCommand =
          settings.systemCommands.serverRestart;
      }
      if (settings.systemCommands.systemRestart !== "") {
        farmPrinters[index].settingsServer.commands.systemRestartCommand =
          settings.systemCommands.systemRestart;
      }
      if (settings.systemCommands.systemShutdown !== "") {
        farmPrinters[index].settingsServer.commands.systemShutdownCommand =
          settings.systemCommands.systemShutdown;
      }

      printer.save().catch((e) => {
        logger.error(JSON.stringify(e), "ERROR savin power settings.");
      });
      // Made the state check from the server, not the client...
      if (farmPrinters[index].state !== "Offline") {
        // Gocde update printer and Live
        let updateOctoPrintGcode = {};
        for (const key in settings.gcode) {
          if (settings.gcode[key].length !== 0) {
            updateOctoPrintGcode[key] = settings.gcode[key];
            farmPrinters[index].settingsScripts.gcode[key] =
              settings.gcode[key];
          }
        }
        const opts = {
          settingsAppearance: {
            name: farmPrinters[index].settingsAppearance.name
          },
          scripts: {
            gcode: updateOctoPrintGcode
          },
          serial: {
            port: settings.connection.preferredPort,
            baudrate: settings.connection.preferredBaud
          },
          server: {
            commands: {
              systemShutdownCommand: settings.systemCommands.systemShutdown,
              systemRestartCommand: settings.systemCommands.systemRestart,
              serverRestartCommand: settings.systemCommands.serverRestart
            }
          },
          // Due to now grabbing the updated state, the client won't have actually sent the "Other" settings tab so these would be undefined.
          webcam: {
            webcamEnabled: settings.other?.enableCamera,
            timelapseEnabled: settings.other?.enableTimeLapse,
            rotate90: settings.other?.rotateCamera,
            flipH: settings.other?.flipHCamera,
            flipV: settings.other?.flipVCamera
          }
        };

        const removeObjectsWithNull = (obj) => {
          return _(obj)
            .pickBy(_.isObject) // get only objects
            .mapValues(removeObjectsWithNull) // call only for values as objects
            .assign(_.omitBy(obj, _.isObject)) // save back result that is not object
            .omitBy(_.isNil) // remove null and undefined from object
            .value(); // get value
        };

        let cleanProfile = removeObjectsWithNull(opts);

        const printerUrl = farmPrinters[index].printerURL;
        const printerApiKey = farmPrinters[index].apikey;
        const patchApiResource = `/api/printerprofiles/${settings.profileID}`;
        const profilePatch = { profile: cleanProfile };
        profile = await this.octoPrintService.patch(
          printerUrl,
          printerApiKey,
          patchApiResource,
          profilePatch,
          false
        );

        // Update octoprint settings
        const settingsApiRoute = `/api/settings`;
        sett = await this.octoPrintService.post(
          printerUrl,
          printerApiKey,
          settingsApiRoute,
          opts,
          false
        );
      }

      PrinterClean.generate(farmPrinters[index], filamentManager);

      return {
        status: {
          octofarm: 200,
          profile: profile.status,
          settings: sett.status
        },
        printer
      };
    } catch (e) {
      logger.error("ERROR updating printer ", JSON.stringify(e.message));
      return {
        status: { octofarm: 400, profile: 900, settings: 900 }
      };
    }
  }

  static async moveFile(id, newPath, fullPath, filename) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    const file = _.findIndex(farmPrinters[i].fileList.files, function (o) {
      return o.name === filename;
    });
    // farmPrinters[i].fileList.files[file].path = newPath;
    farmPrinters[i].fileList.files[file].path = newPath;
    farmPrinters[i].fileList.files[file].fullPath = fullPath;
    farmPrinters[i].markModified("fileList");
    farmPrinters[i].save();
    const currentFilament = await Runner.compileSelectedFilament(
      farmPrinters[i].selectedFilament,
      i
    );
    FileClean.generate(farmPrinters[i], currentFilament);
    FileClean.statistics(farmPrinters);
  }

  static async moveFolder(id, oldFolder, fullPath, folderName) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    const file = _.findIndex(farmPrinters[i].fileList.folders, function (o) {
      return o.name === oldFolder;
    });
    farmPrinters[i].fileList.files.forEach((file, index) => {
      if (file.path === oldFolder) {
        const fileName = farmPrinters[i].fileList.files[
          index
        ].fullPath.substring(
          farmPrinters[i].fileList.files[index].fullPath.lastIndexOf("/") + 1
        );
        farmPrinters[i].fileList.files[
          index
        ].fullPath = `${folderName}/${fileName}`;
        farmPrinters[i].fileList.files[index].path = folderName;
      }
    });
    farmPrinters[i].fileList.folders[file].name = folderName;
    farmPrinters[i].fileList.folders[file].path = fullPath;
    farmPrinters[i].markModified("fileList");
    farmPrinters[i].save();
    const currentFilament = await Runner.compileSelectedFilament(
      farmPrinters[i].selectedFilament,
      i
    );
    FileClean.generate(farmPrinters[i], currentFilament);
    FileClean.statistics(farmPrinters);
  }

  static async deleteFolder(id, fullPath) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == id;
    });
    farmPrinters[i].fileList.files.forEach((file, index) => {
      if (file.path === fullPath) {
        farmPrinters[i].fileList.files.splice(index, 1);
      }
    });
    farmPrinters[i].fileList.folders.forEach((folder, index) => {
      if (folder.path === fullPath) {
        farmPrinters[i].fileList.folders.splice(index, 1);
      }
    });
    const folder = _.findIndex(farmPrinters[i].fileList.folders, function (o) {
      return o.name === fullPath;
    });
    farmPrinters[i].fileList.folders.splice(folder, 1);
    farmPrinters[i].fileList.fileCount = farmPrinters[i].fileList.files.length;
    farmPrinters[i].fileList.folderCount =
      farmPrinters[i].fileList.folders.length;
    farmPrinters[i].markModified("fileList");
    farmPrinters[i].save();
    const currentFilament = await Runner.compileSelectedFilament(
      farmPrinters[i].selectedFilament,
      i
    );
    FileClean.generate(farmPrinters[i], currentFilament);
    FileClean.statistics(farmPrinters);
  }

  static async newFolder(folder) {
    const index = folder.i;
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == index;
    });
    let path = "local";
    let name = folder.foldername;
    if (folder.path !== "") {
      path = folder.path;
      name = `${path}/${name}`;
    }
    const display = JSON.parse(JSON.stringify(name));
    name = name.replace(/ /g, "_");
    const newFolder = {
      name,
      path,
      display
    };

    farmPrinters[i].fileList.folders.push(newFolder);
    farmPrinters[i].fileList.folderCount =
      farmPrinters[i].fileList.folders.length;
    farmPrinters[i].markModified("fileList");
    farmPrinters[i].save();
    const currentFilament = await Runner.compileSelectedFilament(
      farmPrinters[i].selectedFilament,
      i
    );
    FileClean.generate(farmPrinters[i], currentFilament);
    FileClean.statistics(farmPrinters);
  }

  static async updateFilament() {
    for (let i = 0; i < farmPrinters.length; i++) {
      if (Array.isArray(farmPrinters[i].selectedFilament)) {
        for (let f = 0; f < farmPrinters[i].selectedFilament.length; f++) {
          if (farmPrinters[i].selectedFilament[f] !== null) {
            const newInfo = await Filament.findById(
              farmPrinters[i].selectedFilament[f]._id
            );
            const printer = await Printers.findById(farmPrinters[i]._id);
            farmPrinters[i].selectedFilament[f] = newInfo;
            printer.selectedFilament[f] = newInfo;
            printer.save();
            const currentFilament = await Runner.compileSelectedFilament(
              farmPrinters[i].selectedFilament,
              i
            );
            FileClean.generate(farmPrinters[i], currentFilament);
          }
        }
      } else if (farmPrinters[i].selectedFilament != null) {
        const newInfo = await Filament.findById(
          farmPrinters[i].selectedFilament._id
        );
        const printer = await Printers.findById(farmPrinters[i]._id);
        farmPrinters[i].selectedFilament = newInfo;
        printer.selectedFilament = newInfo;
        printer.save();
        const currentFilament = await Runner.compileSelectedFilament(
          farmPrinters[i].selectedFilament,
          i
        );
        FileClean.generate(farmPrinters[i], currentFilament);
      }
    }
  }

  static async selectedFilament(printerId, filamentId, tool) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == printerId;
    });
    const printer = await Printers.findById(printerId);
    // Check if filament already attached...
    // New selectedFilament array, so not array... none selected setup new.

    if (filamentId == 0) {
      printer.selectedFilament[tool] = null;
      farmPrinters[i].selectedFilament[tool] = null;
      // Find in selected filament list and remove
      const selected = _.findIndex(
        farmPrinters[i].selectedFilament,
        function (o) {
          return o == filamentId;
        }
      );
    } else if (!Array.isArray(farmPrinters[i].selectedFilament)) {
      // Setup new spool...
      // Make sure selectedFilament is an array
      farmPrinters[i].selectedFilament = [];
      printer.selectedFilament = [];
      // Find the spool in the database...
      const spool = await Filament.findById(filamentId);
      // Save the spool to correct tool slot in filament array
      printer.selectedFilament[tool] = spool;
      farmPrinters[i].selectedFilament[tool] = spool;
    } else {
      // Already and array... check if spool already selected
      const spool = await Filament.findById(filamentId);
      printer.selectedFilament[tool] = spool;
      farmPrinters[i].selectedFilament[tool] = spool;
    }
    printer.markModified("selectedFilament");
    printer.save().then(async () => {
      const currentFilament = await Runner.compileSelectedFilament(
        farmPrinters[i].selectedFilament,
        i
      );
      FileClean.generate(farmPrinters[i], currentFilament);
    });
  }

  static async newFile(file) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == file.index;
    });
    const date = new Date();

    file = file.files.local;

    let path = "";
    if (file.path.indexOf("/") > -1) {
      path = file.path.substr(0, file.path.lastIndexOf("/"));
    } else {
      path = "local";
    }
    const fileDisplay = file.name.replace(/_/g, " ");
    const data = {
      path: path,
      fullPath: file.path,
      display: fileDisplay,
      length: null,
      name: file.name,
      size: null,
      time: null,
      date: date.getTime() / 1000,
      thumbnail: null,
      success: 0,
      failed: 0,
      last: null
    };
    farmPrinters[i].fileList.files.push(data);
    farmPrinters[i].markModified("fileList");
    farmPrinters[i].save();
    const currentFilament = await Runner.compileSelectedFilament(
      farmPrinters[i].selectedFilament,
      i
    );
    FileClean.generate(farmPrinters[i], currentFilament);
    FileClean.statistics(farmPrinters);
    await this.updateFile(
      farmPrinters[i].fileList.files[farmPrinters[i].fileList.files.length - 1],
      i
    );
  }

  static async updateFile(file, i) {
    if (fileTimeout <= 20000) {
      logger.info(
        `Updating new file ${
          farmPrinters[i].fileList.files[
            farmPrinters[i].fileList.files.length - 1
          ].name
        } for Printer:${farmPrinters[i].printerURL}`
      );
      setTimeout(async function () {
        let path = file.fullPath;
        if (path.includes("local")) {
          path = JSON.parse(JSON.stringify(file.fullPath.replace("local", "")));
        }
        const fileInformation = await Runner.getFile(farmPrinters[i]._id, path);
        fileTimeout = fileTimeout + 5000;
        if (fileInformation) {
          logger.info("New File Information:", fileInformation);
          farmPrinters[i].fileList.files[
            farmPrinters[i].fileList.files.length - 1
          ] = fileInformation;
          farmPrinters[i].markModified("fileList");
          farmPrinters[i].save();
          if (
            fileInformation.time === null ||
            fileInformation.time === "No Time Estimate"
          ) {
            logger.info("File Information Still Missing Retrying...");
            Runner.updateFile(
              farmPrinters[i].fileList.files[
                farmPrinters[i].fileList.files.length - 1
              ],
              i
            );
            const currentFilament = await Runner.compileSelectedFilament(
              farmPrinters[i].selectedFilament,
              i
            );
            FileClean.generate(farmPrinters[i], currentFilament);
            FileClean.statistics(farmPrinters);
            return null;
          } else {
            const currentFilament = await Runner.compileSelectedFilament(
              farmPrinters[i].selectedFilament,
              i
            );
            FileClean.generate(farmPrinters[i], currentFilament);
            FileClean.statistics(farmPrinters);
            return null;
          }
        }
      }, 5000);
    } else {
      logger.info(
        "File information took too long to generate, awaiting manual scan..."
      );
    }
  }

  static sortedIndex() {
    const sorted = [];
    for (let p = 0; p < farmPrinters.length; p++) {
      const sort = {
        sortIndex: farmPrinters[p].sortIndex,
        actualIndex: p
      };
      sorted.push(sort);
    }
    sorted.sort((a, b) => (a.sortIndex > b.sortIndex ? 1 : -1));
    return sorted;
  }

  static async returnPrinterLogs(printerId) {
    const i = _.findIndex(farmPrinters, function (o) {
      return o._id == printerId;
    });

    let connectionLogs = await PrinterClean.generateConnectionLogs(
      farmPrinters[i]
    );
    return connectionLogs;
  }

  static async returnPluginList(printerId) {
    function isCompat(is_compat) {
      if (is_compat.octoprint || is_compat.os || is_compat.python) {
        return true;
      } else {
        return false;
      }
    }

    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }

    if (printerId) {
      const i = _.findIndex(farmPrinters, function (o) {
        return o._id == printerId;
      });
      let compatiblePluginList = [];
      farmPrinters[i].pluginsList.forEach((plugin) => {
        if (typeof plugin.is_compatible !== "undefined") {
          if (isCompat(plugin.is_compatible)) {
            compatiblePluginList.push(plugin);
          }
        } else {
          compatiblePluginList = farmPrinters[i].pluginsList;
        }
      });

      return compatiblePluginList;
    } else {
      let compatiblePluginList = [];
      farmPrinters.forEach((printer) => {
        for (var key in printer.settingsPlugins) {
          if (printer.settingsPlugins.hasOwnProperty(key)) {
            let installedPlugin = _.findIndex(
              printer.pluginsList,
              function (o) {
                return o.id == key;
              }
            );
            if (installedPlugin > -1) {
              compatiblePluginList.push(printer.pluginsList[installedPlugin]);
            }
          }
        }
      });

      return compatiblePluginList;
    }
  }
}

let fileTimeout = 0;

module.exports = {
  Runner
};
