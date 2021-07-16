const Logger = require("../handlers/logger.js");

const Printers = require("../models/Printer.js");
const softwareUpdateChecker = require("../services/octofarm-update.service");
const PrinterService = require("../services/printer.service");
const WebSocketClient = require("../services/octoprint/octoprint-websocket.service");
const { NotImplementedException } = require("../exceptions/runtime.exceptions");
const {
  getPowerSettingsDefault,
  getWolPowerSubSettingsDefault
} = require("../constants/state.constants");
const { OctoprintApiClientService } = require("../services/octoprint/octoprint-api-client.service");
const { HistoryCollection } = require("../services/history.runner.js");
const { JobClean } = require("./data/jobClean.js");
const { PrinterTickerStore } = require("./printer-ticker.store.js");

const logger = new Logger("OctoFarm-State");
let serverSettings = {};

let timeout = null;

class OctoFarmManager {
  #octoPrintService;
  #settingsStore;

  constructor({ settingsStore }) {
    this.#settingsStore = settingsStore;
  }

  async init() {
    timeout = this.#settingsStore.timeout;

    this.#octoPrintService = new OctoprintApiClientService(timeout);
    HistoryCollection.inject(this.#octoPrintService);
  }

  static async trackCounters() {
    const deltaInterval = 30000;

    for (let p = 0; p < farmPrinters.length; p++) {
      const printer = farmPrinters[p];
      const stateCategory = printer.stateColour?.category;
      if (!stateCategory) {
        if (stateCategory === "Active") {
          printer.currentActive += deltaInterval;
        }
        if (
          stateCategory === "Idle" ||
          stateCategory === "Disconnected" ||
          stateCategory === "Complete"
        ) {
          printer.currentIdle += deltaInterval;
        }
        if (stateCategory === "Offline") {
          printer.currentOffline += deltaInterval;
        }
        printer.save().catch((e) => logger.info("Error Saving Counters, Safe to ignore...", e));
      }
    }
  }

  static async reScanOcto(id, skipAPI) {
    const pState = this.getPrinter(id);
    const result = {
      status: null,
      msg: null
    };
    PrinterTickerStore.addIssue(pState, "ReScan Requested... checking socket state", "Active");
    pState.resetConnectionState();
    pState.resetSystemChecksState();
    PrinterClean.generate(pState, serverSettings.filamentManager);

    if (typeof pState.ws !== "undefined" && typeof pState.ws.instance !== "undefined") {
      PrinterTickerStore.addIssue(
        pState,
        `Websocket state ${pState.ws.instance.readyState}`,
        "Active"
      );
      if (pState.ws.instance.readyState === 1) {
        PrinterTickerStore.addIssue(
          pState,
          "Socket currently active, closing and re-setting back up...",
          "Active"
        );
        await pState.ws.instance.close();
        logger.info(`Closed websocket connection for: ${pState.printerURL}`);
        const { _id } = pState;
        await this.setupWebSocket(_id, skipAPI);
      } else if (pState.ws.instance.readyState === 2) {
        PrinterTickerStore.addIssue(
          pState,
          "Socket in tentative state, awaiting for connection attempt to finish... retry in 2000ms",
          "Active"
        );
        pState.setWebsocketTentativeState();

        PrinterClean.generate(pState, serverSettings.filamentManager);

        // TODO call scheduler or emit event instead
        // setTimeout(function () {
        //   PrinterTicker.addIssue(pState, "Retrying socket...", "Active");
        //   Runner.reScanOcto(pState.id, skipAPI);
        // }, 2000);
      } else {
        PrinterTickerStore.addIssue(pState, "Socket currently closed... Re-opening...", "Active");
        const { _id } = pState;
        await pState.ws.instance.close();
        await this.setupWebSocket(_id, skipAPI);
      }
    } else {
      PrinterTickerStore.addIssue(pState, "Socket currently closed... Re-opening...", "Active");
      const { _id } = pState;
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
      serverSettings = server[0];
      const Polling = serverSettings.onlinePolling;
      const throt = {};
      logger.info(`Updating websock poll time: ${(Polling.seconds * 1000) / 500}`);
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
        logger.info(`Closed websocket connection for: ${farmPrinters[i].printerURL}`);
      }
    }
    return true;
  }

  static getState(id) {
    const printer = this.getPrinter(id);
    printer.systemChecks.scanning.state.status = "warning";
    PrinterTickerStore.addIssue(printer, "Grabbing state information...", "Active");
    return this.octoPrintService
      .getConnection(printer, true)
      .then((res) => {
        return res.json();
      })
      .then(async (res) => {
        // Update info to DB
        if (res.current.state === "Offline") {
          res.current.state = "Disconnected";
          printer.stateDescription = "Your printer is disconnected";
        } else if (res.current.state.includes("Error:")) {
          printer.stateDescription = res.current.state;
          res.current.state = "Error!";
        } else if (res.current.state === "Closed") {
          res.current.state = "Disconnected";
          printer.stateDescription = "Your printer is disconnected";
        } else {
          printer.stateDescription = "Current Status from OctoPrint";
        }
        printer.current = res.current;
        printer.options = res.options;
        printer.job = null;
        printer.systemChecks.scanning.state.status = "success";
        printer.systemChecks.scanning.state.date = new Date();
        const currentFilament = JSON.parse(JSON.stringify(printer.selectedFilament));

        JobClean.generate(printer, currentFilament);
        PrinterTickerStore.addIssue(printer, "Grabbed state information...", "Complete");
        logger.info(`Successfully grabbed Current State for...: ${printer.printerURL}`);
      })
      .catch((err) => {
        printer.systemChecks.scanning.state.status = "danger";
        printer.systemChecks.scanning.state.date = new Date();
        PrinterTickerStore.addIssue(
          printer,
          `Error grabbing state information: ${err}`,
          "Disconnected"
        );
        logger.error(`Error grabbing state for: ${printer.printerURL} Reason: `, err);
        return false;
      });
  }

  static getProfile(id) {
    const printer = this.getPrinter(id);
    printer.systemChecks.scanning.profile.status = "warning";
    PrinterTickerStore.addIssue(printer, "Grabbing profile information...", "Active");
    return this.octoPrintService
      .getPrinterProfiles(printer, true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        // Update info to DB
        printer.profiles = res.profiles;
        printer.systemChecks.scanning.profile.status = "success";
        printer.systemChecks.scanning.profile.date = new Date();
        PrinterTickerStore.addIssue(printer, "Grabbed profile information...", "Complete");
        logger.info(`Successfully grabbed Profiles.js for...: ${printer.printerURL}`);
      })
      .catch((err) => {
        PrinterTickerStore.addIssue(
          printer,
          `Error grabbing profile information: ${err}`,
          "Disconnected"
        );
        printer.systemChecks.scanning.profile.status = "danger";
        printer.systemChecks.scanning.profile.date = new Date();
        logger.error(`Error grabbing profile for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  static getPluginList(id) {
    const printer = this.getPrinter(id);
    if (softwareUpdateChecker.getUpdateNotificationIfAny().air_gapped) {
      PrinterTickerStore.addIssue(
        printer,
        `Farm is air gapped, skipping OctoPrint plugin list request`,
        "Active"
      );
      return false;
    }

    printer.pluginsList = [];
    PrinterTickerStore.addIssue(printer, "Grabbing plugin list", "Active");

    return this.octoPrintService
      .getPluginManager(printer, true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        printer.pluginsList = res.repository.plugins;
        PrinterTickerStore.addIssue(
          printer,
          `Grabbed plugin list (OctoPrint compatibility: ${printer.octoPrintVersion})`,
          "Complete"
        );
      })
      .catch((err) => {
        PrinterTickerStore.addIssue(
          printer,
          `Error grabbing plugin list information: ${err}`,
          "Disconnected"
        );
        logger.error(`Error grabbing plugin list for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  static getOctoPrintSystemInfo(id) {
    const printer = this.getPrinter(id);
    printer.octoPrintSystemInfo = {};
    PrinterTickerStore.addIssue(printer, "Grabbing OctoPrint's System Information", "Active");
    return this.octoPrintService
      .getSystemInfo(printer, true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        printer.octoPrintSystemInfo = res.systeminfo;
        PrinterTickerStore.addIssue(printer, "Grabbed OctoPrints System Info", "Complete");
      })
      .catch((err) => {
        PrinterTickerStore.addIssue(
          printer,
          `Error grabbing system information: ${err}`,
          "Disconnected"
        );
        printer.systemChecks.scanning.profile.status = "danger";
        printer.systemChecks.scanning.profile.date = new Date();
        logger.error(`Error grabbing system for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  static getUpdates(id, force = false) {
    const printer = this.getPrinter(id);
    if (softwareUpdateChecker.getUpdateNotificationIfAny().air_gapped) {
      PrinterTickerStore.addIssue(
        printer,
        `Farm is air gapped, skipping OctoPrint updates request`,
        "Active"
      );
      return false;
    }
    printer.octoPrintUpdate = [];
    printer.octoPrintPluginUpdates = [];

    PrinterTickerStore.addIssue(printer, "Checking OctoPrint for updates...", "Active");

    return this.octoPrintService
      .getSoftwareUpdateCheck(printer, force, true)
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
        printer.octoPrintUpdate = octoPrintUpdate;
        printer.octoPrintPluginUpdates = pluginUpdates;

        PrinterTickerStore.addIssue(printer, "Octoprints checked for updates...", "Complete");
      })
      .catch((err) => {
        PrinterTickerStore.addIssue(
          printer,
          `Error grabbing octoprint updates information: ${err}`,
          "Disconnected"
        );
        logger.error(`Error grabbing octoprint updates for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  static async killPowerSettings(printerID) {
    try {
      const fprinter = this.getPrinter(id);
      fprinter.powerSettings = getPowerSettingsDefault();
      fprinter.powerSettings.wol = {
        enabled: fprinter.powerSettings.wol.enabled,
        ip: fprinter.powerSettings.wol.ip,
        packets: fprinter.powerSettings.wol.packets,
        port: fprinter.powerSettings.wol.port,
        interval: fprinter.powerSettings.wol.interval,
        MAC: fprinter.powerSettings.wol.MAC
      };
      const printer = await Printers.findById(fprinter._id);
      printer.powerSettings = printer.powerSettings;
      printer.save();
      return true;
    } catch (e) {
      return false;
    }
  }

  static async getSettings(id) {
    const printer = this.getPrinter(id);
    printer.systemChecks.scanning.settings.status = "warning";
    PrinterTickerStore.addIssue(printer, "Grabbing settings information...", "Active");
    return this.octoPrintService
      .getSettings(printer, true)
      .then((res) => {
        return res.json();
      })
      .then(async (res) => {
        // Update info to DB
        printer.corsCheck = res.api.allowCrossOrigin;
        printer.settingsApi = res.api;
        if (!printer.settingsAppearance) {
          printer.settingsAppearance = res.appearance;
        } else if (printer.settingsAppearance.name === "") {
          printer.settingsAppearance.name = res.appearance.name;
        }
        if (res.plugins["pi_support"]) {
          PrinterTickerStore.addIssue(
            printer,
            "Pi Plugin detected... scanning for version information...",
            "Active"
          );

          let piSupport = await this.octoPrintService.getPluginPiSupport(printer);
          piSupport = await piSupport.json();

          printer.octoPi = {
            model: piSupport.model,
            version: piSupport.octopi_version
          };

          PrinterTickerStore.addIssue(
            printer,
            "Sucessfully grabbed OctoPi information...",
            "Complete"
          );
        }
        if (res.plugins.costestimation) {
          if (_.isEmpty(printer.costSettings) || printer.costSettings.powerConsumption === 0.5) {
            PrinterTickerStore.addIssue(
              printer,
              "Cost Plugin detected... Updating OctoFarms Cost settings",
              "Active"
            );
            printer.costSettings = {
              powerConsumption: res.plugins.costestimation.powerConsumption,
              electricityCosts: res.plugins.costestimation.costOfElectricity,
              purchasePrice: res.plugins.costestimation.priceOfPrinter,
              estimateLifespan: res.plugins.costestimation.lifespanOfPrinter,
              maintenanceCosts: res.plugins.costestimation.maintenanceCosts
            };
            const printer = await Printers.findById(id);

            await printer.save();
            PrinterTickerStore.addIssue(printer, "Saved Cost Estimation settings", "Complete");
          }
        }

        if (res.plugins["psucontrol"]) {
          if (_.isEmpty(printer.powerSettings) && printer.powerSettings.powerOffCommand === "") {
            PrinterTickerStore.addIssue(
              new Date(),
              printer,
              "PSU Control plugin detected... Updating OctoFarm power settings...",
              "Active"
            );
            printer.powerSettings = {
              powerOnCommand: '{"command":"turnPSUOn"}',
              powerOnURL: "[PrinterURL]/api/plugin/psucontrol",
              powerOffCommand: '{"command":"turnPSUOff"}',
              powerOffURL: "[PrinterURL]/api/plugin/psucontrol",
              powerToggleCommand: '{"command":"togglePSU"}',
              powerToggleURL: "[PrinterURL]/api/plugin/psucontrol",
              powerStatusCommand: '{"command":"getPSUState"}',
              powerStatusURL: "[PrinterURL]/api/plugin/psucontrol",
              wol: getWolPowerSubSettingsDefault()
            };
            const printer = await Printers.findById(id);

            await printer.save();
            PrinterTickerStore.addIssue(
              new Date(),
              printer.printerURL,
              "Successfully saved PSU control settings...",
              "Complete",
              printer._id
            );
          }
        }
        printer.settingsFeature = res.feature;
        printer.settingsFolder = res.folder;
        printer.settingsPlugins = res.plugins;
        printer.settingsScripts = res.scripts;
        printer.settingsSerial = res.serial;
        printer.settingsServer = res.server;
        printer.settingsSystem = res.system;
        printer.settingsWebcam = res.webcam;
        if (printer.camURL === "") {
          if (
            typeof res.webcam !== "undefined" &&
            typeof res.webcam.streamUrl !== "undefined" &&
            res.webcam.streamUrl != null
          ) {
            if (res.webcam.streamUrl.includes("http")) {
              printer.camURL = res.webcam.streamUrl;
            } else {
              printer.camURL = printer.printerURL + res.webcam.streamUrl;
            }
            const printer = await Printers.findById(id);
            printer.camURL = printer.camURL;
            await printer.save();
          }
        }

        PrinterTickerStore.addIssue(
          new Date(),
          printer.printerURL,
          "Grabbed settings information...",
          "Complete",
          printer._id
        );

        printer.systemChecks.scanning.settings.status = "success";
        printer.systemChecks.scanning.settings.date = new Date();
        logger.info(`Successfully grabbed Settings for...: ${printer.printerURL}`);
      })
      .catch((err) => {
        PrinterTickerStore.addIssue(
          new Date(),
          printer.printerURL,
          `Error grabbing settings information: ${err}`,
          "Offline",
          printer._id
        );
        printer.systemChecks.scanning.settings.status = "danger";
        printer.systemChecks.scanning.settings.date = new Date();
        logger.error(`Error grabbing settings for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  static getSystem(id) {
    const printer = this.getPrinter(id);
    printer.systemChecks.scanning.system.status = "warning";
    PrinterTickerStore.addIssue(printer, "Grabbing system information...", "Active");
    return this.octoPrintService
      .getSystemCommands(printer, true)
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        // Update info to DB
        // TODO WHAT THE IS CORE???
        // printer.core = res.core;

        printer.setSystemSuccessState();
        PrinterTickerStore.addIssue(
          new Date(),
          printer,
          "Grabbed system information...",
          "Complete"
        );

        logger.info(`Successfully grabbed System Information for...: ${printer.printerURL}`);
      })
      .catch((err) => {
        PrinterTickerStore.addIssue(
          printer,
          `Error grabbing system information: ${err}`,
          "Offline"
        );
        printer.setSystemSuccessState(true);
        logger.error(`Error grabbing system for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  static async getLatestOctoPrintSettingsValues(id) {
    // TODO NO! This is absolutely not a good idea... this is a chained API call of 500ms+
    // const printer = this.getPrinter(id);
    // // This was causing slowdown of settings pages when loading, we should only be running this command when printer is considered online.
    // if (printer.state !== "Offline") {
    //   // This is why the settings we're not updating! Forgot that connection options and preferences come in state, not settings/system.
    //   await Runner.getState(id);
    //   // Update the printers cached settings from OctoPrint
    //   await Runner.getSettings(id);
    //   // Update the printers cached system settings from OctoPrint
    //   await Runner.getSystem(id);
    //   // Re-generate the printer clean information - This is just cautionary, my tests showed it wasn't needed.
    // }
    //
    // await PrinterClean.generate(printer, serverSettings.filamentManager);
  }

  static async updateSettings(settings) {
    // Okay bye.
    throw new NotImplementedException();
  }

  static async returnPrinterLogs(printerId) {
    const printer = this.getPrinter(printerId);

    return await PrinterClean.generateConnectionLogs(printer);
  }

  // Dubious unpredictable code due to 1 or * lookup
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
      const printer = this.getPrinter(printerId);
      let compatiblePluginList = [];
      printer.pluginsList.forEach((plugin) => {
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
            let installedPlugin = _.findIndex(printer.pluginsList, function (o) {
              return o.id == key;
            });
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

module.exports = OctoFarmManager;
