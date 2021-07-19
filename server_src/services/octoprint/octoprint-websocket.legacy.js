const { PrinterTickerStore } = require("../../state/printer-ticker.store");
const WebSocket = require("ws");

class OctoprintWebsocketLegacy {
  number = 0; // Message number
  autoReconnectInterval = timeout.webSocketRetry; // ms

  // Cross-correlation data to be passed for events or as input to callbacks
  #url;
  #index;

  #instance;

  constructor(url, index) {
    this.#index = index;
    this.#url = `${url}/sockjs/websocket`;
    this.#instance = new WebSocket(this.#url, { followRedirects: true });
  }

  open() {
    try {
      // TODO printerstore
      printert.webSocket = "warning";
      printert.webSocketDescription =
        "Websocket Connected but in Tentative state until receiving data";

      this.instance.on("open", () => {
        this.isAlive = true;
        try {
          this.onopen(this.index);
        } catch (e) {
          logger.info(`Cannot re-open web socket... : ${this.index}: ${this.url}`);
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
          logger.info(e, "There was an issue opening the websocket... hard fail...");
          this.instance.emit("error", e);
        }
      });
      this.instance.on("close", (e) => {
        switch (e) {
          case 1000: // CLOSE_NORMAL
            logger.info(`WebSocket: closed: ${this.index}: ${this.url}`);
            try {
              // TODO printer store
              farmPrinters[this.index].state = "Offline";
              farmPrinters[this.index].stateColour = Runner.getColour("Offline");
              farmPrinters[this.index].hostState = "Shutdown";
              farmPrinters[this.index].hostStateColour = Runner.getColour("Shutdown");
              farmPrinters[this.index].webSocket = "danger";
              farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
              farmPrinters[this.index].hostDescription = "Host is Shutdown";
              farmPrinters[this.index].webSocketDescription = "Websocket Closed by OctoFarm";
              this.instance.removeAllListeners();
              if (typeof farmPrinters[this.index] !== "undefined") {
                PrinterClean.generate(farmPrinters[this.index], systemSettings.filamentManager);
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
              // TODO printer store
              farmPrinters[this.index].state = "Offline";
              farmPrinters[this.index].stateColour = Runner.getColour("Offline");
              farmPrinters[this.index].hostState = "Shutdown";
              farmPrinters[this.index].hostStateColour = Runner.getColour("Shutdown");
              farmPrinters[this.index].webSocket = "danger";
              farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
              farmPrinters[this.index].hostDescription = "Host is Shutdown";
              farmPrinters[this.index].webSocketDescription = "Websocket Closed by OctoFarm";
              this.instance.removeAllListeners();
              if (typeof farmPrinters[this.index] !== "undefined") {
                PrinterClean.generate(farmPrinters[this.index], systemSettings.filamentManager);
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
              farmPrinters[this.index].hostStateColour = Runner.getColour("Shutdown");
              farmPrinters[this.index].webSocket = "danger";
              farmPrinters[this.index].stateDescription = "OctoPrint is Offline";
              farmPrinters[this.index].hostDescription = "Host is Shutdown";
              farmPrinters[this.index].webSocketDescription =
                "Websocket Terminated by OctoFarm, Ping/Pong check fails";
              this.instance.removeAllListeners();
              if (typeof farmPrinters[this.index] !== "undefined") {
                PrinterClean.generate(farmPrinters[this.index], systemSettings.filamentManager);
              }
            } catch (e) {
              logger.info(
                `Ping/Pong failed to get a response, closing and attempted to reconnect: ${this.index}: ${this.url}`
              );
            }
            PrinterTickerStore.addIssue(
              farmPrinters[this.index],
              "Client error, setting back up... in 10000ms",
              "Offline"
            );

            // TODO FFS
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
              farmPrinters[this.index].hostStateColour = Runner.getColour("Online");
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
              farmPrinters[this.index].hostStateColour = Runner.getColour("Shutdown");
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
              farmPrinters[this.index].hostStateColour = Runner.getColour("Shutdown");
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
              farmPrinters[this.index].hostStateColour = Runner.getColour("Shutdown");
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
              farmPrinters[this.index].hostStateColour = Runner.getColour("Offline");
              farmPrinters[this.index].webSocket = "danger";
              farmPrinters[this.index].stateDescription =
                "Hard Failure, please Re-Sync when Online";
              farmPrinters[this.index].hostDescription = "Hard Failure, please Re-Sync when Online";
              farmPrinters[this.index].webSocketDescription =
                "Hard Failure, please Re-Sync when Online";
              this.instance.removeAllListeners();

              if (typeof farmPrinters[this.index] !== "undefined") {
                PrinterClean.generate(farmPrinters[this.index], systemSettings.filamentManager);
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
      logger.info(JSON.stringify(e), "There was an issue opening the websocket... hard fail...");
      PrinterTickerStore.addIssue(
        farmPrinters[this.index],
        "Client error, setting back up... in 10000ms",
        "Offline"
      );

      // TODO FFS
      setTimeout(async () => {
        Runner.reScanOcto(farmPrinters[this.index]._id);
        logger.info("Error with websockets... resetting up!");
      }, 10000);
    }
  }

  throttle(data) {
    PrinterTickerStore.addIssue(
      farmPrinters[this.index],
      "Throttling websocket connection...",
      "Active"
    );
    try {
      logger.info(`Throttling your websocket connection: ${this.index}: ${this.url} `, data);
      this.instance.send(JSON.stringify(data));
    } catch (e) {
      logger.error(`Failed to Throttle websocket: ${this.index}: ${this.url}`);
      this.instance.emit("error", e);
    }
  }

  send(data, option) {
    try {
      this.instance.send(data, option).then((res) => console.log(res));
    } catch (e) {
      this.instance.emit("error", e);
    }
  }

  async reconnect(e) {
    PrinterTickerStore.addIssue(
      farmPrinters[this.index],
      "Connection lost... reconnecting in: " + this.autoReconnectInterval + "ms",
      "Active"
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
        PrinterClean.generate(farmPrinters[that.index], systemSettings.filamentManager);
      }
      that.open(that.url, that.index);
    }, this.autoReconnectInterval);
    return true;
  }

  async onopen(e) {
    const Polling = systemSettings.onlinePolling;
    const data = {};
    const throt = {};
    data.auth = `${farmPrinters[this.index].currentUser}:${farmPrinters[this.index].sessionKey}`;
    throt.throttle = parseInt(Polling.seconds * 2);

    this.instance.send(JSON.stringify(data));
    this.instance.send(JSON.stringify(throt));
    PrinterTickerStore.addIssue(
      farmPrinters[this.index],
      "Opened the websocket connection...",
      "Active"
    );
    if (typeof farmPrinters[this.index] !== "undefined") {
      PrinterClean.generate(farmPrinters[this.index], systemSettings.filamentManager);
    }
  }

  async onmessage(data, flags, number) {
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

        if (data.connected.version.includes("1.4.2") || data.connected.version.includes("1.4.1")) {
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
        PrinterTickerStore.addIssue(
          farmPrinters[this.index],
          "Successfully opened websocket connection...",
          "Complete"
        );
      }
      // Listen for printer status
      if (typeof data.current !== "undefined") {
        farmPrinters[this.index].webSocket = "success";
        farmPrinters[this.index].webSocketDescription = "Websocket Alive and Receiving Data";
        if (data.current.state.text === "Offline") {
          data.current.state.text = "Disconnected";
          farmPrinters[this.index].stateDescription = "Your printer is disconnected";
        } else if (
          data.current.state.text.includes("Error:") ||
          data.current.state.text.includes("error")
        ) {
          farmPrinters[this.index].stateDescription = data.current.state.text;
          data.current.state.text = "Error!";
        } else if (data.current.state.text === "Closed") {
          res.current.state.text = "Disconnected";
          farmPrinters[this.index].stateDescription = "Your printer is disconnected";
        } else {
          farmPrinters[this.index].stateDescription = "Current Status from OctoPrint";
        }
        farmPrinters[this.index].state = data.current.state.text;
        farmPrinters[this.index].stateColour = Runner.getColour(data.current.state.text);
        if (typeof data.current.resends !== "undefined") {
          farmPrinters[this.index].resends = data.current.resends;
        }

        if (typeof data.current.progress !== "undefined") {
          farmPrinters[this.index].progress = data.current.progress;
        } else {
          farmPrinters[this.index].progress = 0;
        }
        if (typeof data.current.currentZ !== "undefined" && data.currentZ !== null) {
          farmPrinters[this.index].currentZ = data.current.currentZ;
        }
        if (typeof data.current.job !== "undefined" && data.current.job.user !== null) {
          farmPrinters[this.index].job = data.current.job;
          const currentFileIndex = _.findIndex(
            farmPrinters[this.index].fileList.files,
            function (o) {
              return o.name === data.current.job.file.name;
            }
          );
          if (currentFileIndex > -1) {
            if (
              typeof farmPrinters[this.index].fileList.files[currentFileIndex] !== "undefined" &&
              farmPrinters[this.index].fileList.files[currentFileIndex].thumbnail != null
            ) {
              farmPrinters[this.index].job.file.thumbnail =
                farmPrinters[this.index].fileList.files[currentFileIndex].thumbnail;
            }
            if (typeof farmPrinters[this.index].fileList.files[currentFileIndex] !== "undefined") {
              farmPrinters[this.index].job.file.length =
                farmPrinters[this.index].fileList.files[currentFileIndex].length;
            }
          }
          const currentFilament = JSON.parse(
            JSON.stringify(farmPrinters[this.index].selectedFilament)
          );
          for (let s = 0; s < farmPrinters[this.index].selectedFilament.length; s++) {
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
          for (let s = 0; s < farmPrinters[this.index].selectedFilament.length; s++) {
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
        if (typeof data.current.temps !== "undefined" && data.current.temps.length !== 0) {
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
                farmPrinters[this.index].tempTimer = farmPrinters[this.index].tempTimer + 1000;
              }
            }
          }
        }
        if (data.current.progress.completion != null && data.current.progress.completion === 100) {
          farmPrinters[this.index].stateColour = Runner.getColour("Complete");
          farmPrinters[this.index].stateDescription = "Your current print is Completed!";
        } else {
          farmPrinters[this.index].stateColour = Runner.getColour(data.current.state.text);
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
            files = JSON.parse(JSON.stringify(farmPrinters[that.index].fileList.files));
            let resendStats = null;
            if (typeof farmPrinters[that.index].resends !== "undefined") {
              resendStats = JSON.parse(JSON.stringify(farmPrinters[that.index].resends));
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
            files = JSON.parse(JSON.stringify(farmPrinters[that.index].fileList.files));
            let resendStats = null;
            if (typeof farmPrinters[that.index].resends !== "undefined") {
              resendStats = JSON.parse(JSON.stringify(farmPrinters[that.index].resends));
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
            files = JSON.parse(JSON.stringify(farmPrinters[that.index].fileList.files));
            if (farmPrinters[that.index].job) {
              job = JSON.parse(JSON.stringify(farmPrinters[that.index].job));
            }
            // Register cancelled print...
            await HistoryCollection.errorLog(data.event.payload, sendPrinter, job, files);
            await Runner.updateFilament();
            setTimeout(async function () {
              if (!_.isEmpty(job)) {
                await Runner.reSyncFile(farmPrinters[that.index]._id, job.file.path);
              }
            }, 500);
          }, 10000);
        }
      }
      if (data.plugin) {
        if (data.plugin.data.type === "loglines") {
          if (
            typeof data.plugin.data !== "undefined" &&
            typeof data.plugin.data.loglines !== "undefined"
          ) {
            data.plugin.data.loglines.forEach((logLine) => {
              if (logLine.stream === "call" || logLine.stream === "message") {
                PrinterTickerStore.addOctoPrintLog(
                  farmPrinters[this.index],
                  logLine.line,
                  "Active",
                  data.plugin.plugin
                );
              } else if (logLine.stream === "stdout") {
                PrinterTickerStore.addOctoPrintLog(
                  farmPrinters[this.index],
                  logLine.line,
                  "Complete",
                  data.plugin.plugin
                );
              } else {
                PrinterTickerStore.addOctoPrintLog(
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
          if (data.plugin.data.payload.includes("Firmware version:")) {
            farmPrinters[this.index].klipperFirmwareVersion = data.plugin.data.payload.replace(
              "Firmware version: ",
              ""
            );
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
          if (typeof farmPrinters[this.index].events._events.cooldown === "undefined") {
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
  }

  onerror(e) {
    PrinterTickerStore.addIssue(
      farmPrinters[this.index].printerURL,
      "Whoopsy! Big error...",
      "Offline"
    );
    logger.error("WebSocketClient: Error", arguments, `${+this.index}: ${this.url} - ${e}`);
    this.instance.removeAllListeners();
    try {
      this.onopen = null;
      this.onclose = null;
      this.onerror = null;
      this.onmessage = null;
    } catch (e) {
      logger.info(JSON.stringify(e), "Couldn't delete old listeners... must not exist.");
    }

    if (typeof farmPrinters[this.index] !== "undefined") {
      //Reset job to null on error...
      farmPrinters[this.index].job = null;
      JobClean.generate(farmPrinters[this.index]);
      PrinterClean.generate(farmPrinters[this.index], systemSettings.filamentManager);
    }
  }

  onclose(e) {
    if (typeof farmPrinters[this.index] !== "undefined") {
      PrinterTickerStore.addIssue(farmPrinters[this.index], "Client closed...", "Offline");
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
      logger.info(JSON.stringify(e), "Couldn't delete old listeners... must not exist.");
    }

    if (typeof farmPrinters[this.index] !== "undefined") {
      //Reset job to null on error...
      farmPrinters[this.index].job = null;
      JobClean.generate(farmPrinters[this.index]);
      PrinterClean.generate(farmPrinters[this.index], systemSettings.filamentManager);
    }
  }
}

function heartBeat(index) {
  if (farmPrinters[index].state === "Disconnected") {
    farmPrinters[index].webSocket = "warning";
    farmPrinters[index].webSocketDescription =
      "Websocket Connected but in Tentative state until receiving data";
  } else {
    farmPrinters[index].webSocket = "success";
    farmPrinters[index].webSocketDescription = "Websocket Connection Online";
  }
  PrinterTickerStore.addIssue(
    farmPrinters[index],
    "Pong message received from client...",
    "Complete"
  );
  farmPrinters[index].ws.isAlive = true;
}

module.exports = OctoprintWebsocketLegacy;
