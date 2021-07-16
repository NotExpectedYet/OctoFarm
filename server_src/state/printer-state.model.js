const { getSystemChecksDefault, mapStateToColor } = require("../constants/state.constants");

/**
 * This is a model to simplify unified printers state
 * This class is designed with serialization to network, file and possibly database in mind.
 */
class PrinterStateModel {
  #id;

  #state = "Setting Up";
  #stateColour = mapStateToColor("Offline");
  #stateDescription = "Setting up your Printer";

  #hostState = "Setting Up";
  #hostStateColour = mapStateToColor("Offline");
  #hostDescription = "Setting up your Printer";

  #webSocket = "danger";
  #webSocketDescription = "Websocket unconnected";
  #wsClient; // :WebSocketClient
  #sessionKey;

  #stepRate = 10;
  #systemChecks = getSystemChecksDefault();
  #alerts = null;

  // We could split this off to a substate cache container as this data is hot from OP
  #gcodeScripts;
  #octoPrintVersion;
  #octoPrintSystemInfo;
  #currentProfile;
  #octoPi;

  // New idea to enable/disable printers
  // enabled = false;

  constructor(id) {
    this.#id = id.toString();
  }

  get id() {
    return this.#id;
  }

  toFlat() {
    return Object.freeze({
      _id: this.#id, //! yup were going back
      printerState: {
        state: this.#state,
        colour: this.#stateColour,
        desc: this.#stateDescription
      },
      hostState: {
        state: this.#hostState,
        colour: this.#hostStateColour,
        desc: this.#hostDescription
      },
      webSocketState: {
        colour: this.#webSocket,
        desc: this.#webSocketDescription
      },
      stepRate: this.#stepRate,
      systemChecks: this.#systemChecks,
      alerts: this.#alerts,

      // Hot OP data
      octoPrintVersion: "versione",
      octoPrintSystemInfo: {
        "printer.firmware": "klippah"
      },
      currentProfile: {}, // TODO this should not decide client 'Printer' column (octoPrintSystemInfo)
      octoPi: {
        version: "sure",
        model: "American Pi"
      },

      // Unmapped data - comes from database model so needs work
      sortIndex: 0,
      printerName: "asd",
      group: "yeah",
      groups: [],
      otherSettings: {}
    });
  }

  resetConnectionState() {
    this.#state = "Searching...";
    this.#stateColour = mapStateToColor("Searching...");
    this.#stateDescription = "Re-scanning your OctoPrint Instance";

    this.#hostState = "Searching...";
    this.#hostStateColour = mapStateToColor("Searching...");
    this.#hostDescription = "Re-scanning for OctoPrint Host";

    this.#webSocket = "danger";
    this.#webSocketDescription = "Websocket closed";
  }

  resetSystemChecksState() {
    this.#systemChecks.api.status = "warning";
    this.#systemChecks.files.status = "warning";
    this.#systemChecks.state.status = "warning";
    this.#systemChecks.profile.status = "warning";
    this.#systemChecks.settings.status = "warning";
    this.#systemChecks.system.status = "warning";
  }

  setSearchingState() {
    this.#state = "Searching...";
    this.#stateColour = mapStateToColor("Searching...");
    this.#stateDescription = "Attempting to connect to OctoPrint";

    this.#hostState = "Searching...";
    this.#hostStateColour = mapStateToColor("Searching...");
    this.#hostDescription = "Attempting to connect to OctoPrint";

    this.#webSocket = "danger";
    this.#webSocketDescription = "Websocket Offline";

    this.#systemChecks.api.status = "warning";
  }

  setWebsocketTentativeState() {
    this.#webSocket = "info";
    this.#webSocketDescription = "Awaiting current websocket attempt to end...";
  }

  setApiSuccessState() {
    this.#systemChecks.api.status = "success";
    this.#systemChecks.api.date = new Date();
  }

  setApiLoginSuccessState(sessionKey) {
    this.#sessionKey = sessionKey;

    this.#hostState = "Online";
    this.#hostStateColour = mapStateToColor("Online");
    this.#hostDescription = "Host is Online";
  }

  setFilesSuccessState() {
    this.#systemChecks.files.status = "success";
    this.#systemChecks.files.date = new Date();
  }

  setSystemSuccessState(success = true) {
    this.#systemChecks.system.status = success ? "success" : "danger";
    this.#systemChecks.system.date = new Date();
  }

  attachWebsocketClient(ws) {
    this.#wsClient = ws;
  }

  openWebsocket() {
    if (!this.#wsClient) {
      throw new Error("Websocket client was not bound to this ");
    }
    this.#wsClient.open();
  }
}

module.exports = PrinterStateModel;

// sortGCODE(settings) {
//   return settings.gcode || null;
// }

// sortProfile(profile, current) {
//   if (!profile || !current) return null;
//   return profile[current.printerProfile];
// }
//
// sortTemps(temps) {
//   return temps || null;
// }

// generate(farmPrinter, filamentManager) {
//   fmToggle = filamentManager;
//   try {
//     if (typeof farmPrinter.systemChecks !== "undefined") {
//       farmPrinter.systemChecks.cleaning.information.status = "warning";
//     }
//
//     const sortedPrinter = {
//       _id: farmPrinter._id,
//       sortIndex: farmPrinter.sortIndex,
//       hostState: {
//         state: farmPrinter.hostState,
//         colour: farmPrinter.hostStateColour,
//         desc: farmPrinter.hostDescription
//       },
//       printerState: {
//         state: farmPrinter.state,
//         colour: farmPrinter.stateColour,
//         desc: farmPrinter.stateDescription
//       },
//       webSocketState: {
//         colour: farmPrinter.webSocket,
//         desc: farmPrinter.webSocketDescription
//       },
//       group: farmPrinter.group,
//       groups: [], // TODO unfinished feature
//       printerURL: farmPrinter.printerURL,
//       webSocketURL: farmPrinter.webSocketURL,
//       cameraURL: farmPrinter.camURL,
//       apikey: farmPrinter.apikey,
//       octoPrintVersion: farmPrinter.octoPrintVersion,
//       flowRate: farmPrinter.flowRate,
//       feedRate: farmPrinter.feedRate,
//       stepRate: farmPrinter.stepRate,
//       systemChecks: farmPrinter.systemChecks,
//       currentIdle: farmPrinter.currentIdle,
//       currentActive: farmPrinter.currentActive,
//       currentOffline: farmPrinter.currentOffline,
//       dateAdded: farmPrinter.dateAdded,
//       corsCheck: farmPrinter.corsCheck,
//       currentUser: farmPrinter.currentUser,
//       octoPrintUpdate: farmPrinter.octoPrintUpdate,
//       octoPrintPluginUpdates: farmPrinter.octoPrintPluginUpdates,
//       display: true,
//       order: farmPrinter.sortIndex,
//       octoPrintSystemInfo: farmPrinter.octoPrintSystemInfo
//     };
//
//     if (!farmPrinter.resends) {
//       sortedPrinter.resends = farmPrinter.resends;
//     }
//     sortedPrinter.tools = PrinterClean.sortTemps(farmPrinter.temps);
//     sortedPrinter.currentJob = JobClean.getCleanJobAtIndex(farmPrinter.sortIndex);
//     sortedPrinter.selectedFilament = farmPrinter.selectedFilament;
//
//     sortedPrinter.fileList = FileClean.returnFiles(farmPrinter.sortIndex);
//     sortedPrinter.currentProfile = PrinterClean.sortProfile(
//       farmPrinter.profiles,
//       farmPrinter.current
//     );
//     sortedPrinter.currentConnection = PrinterClean.sortConnection(farmPrinter.current);
//     sortedPrinter.connectionOptions = farmPrinter.options;
//     if (
//       !!sortedPrinter?.connectionOptions?.ports &&
//       !sortedPrinter.connectionOptions.ports.includes("AUTO")
//     ) {
//       sortedPrinter.connectionOptions.baudrates.unshift(0);
//       sortedPrinter.connectionOptions.ports.unshift("AUTO");
//     }
//     sortedPrinter.terminal = PrinterClean.sortTerminal(farmPrinter.sortIndex, farmPrinter.logs);
//     sortedPrinter.costSettings = farmPrinter.costSettings;
//     sortedPrinter.powerSettings = farmPrinter.powerSettings;
//     sortedPrinter.gcodeScripts = PrinterClean.sortGCODE(farmPrinter.settingsScripts);
//     sortedPrinter.otherSettings = PrinterClean.sortOtherSettings(
//       farmPrinter.tempTriggers,
//       farmPrinter.settingsWebcam,
//       farmPrinter.settingsServer
//     );
//     sortedPrinter.printerName = PrinterClean.grabPrinterName(farmPrinter);
//     sortedPrinter.storage = farmPrinter.storage;
//     sortedPrinter.tempHistory = farmPrinter.tempHistory;
//
//     if (typeof farmPrinter.octoPi !== "undefined") {
//       sortedPrinter.octoPi = farmPrinter.octoPi;
//     }
//     sortedPrinter.connectionLog = this.#printerConnectionLogs[farmPrinter.sortIndex];
//     if (typeof farmPrinter.klipperFirmwareVersion !== "undefined") {
//       sortedPrinter.klipperFirmwareVersion = farmPrinter.klipperFirmwareVersion.substring(0, 6);
//     }
//
//     if (typeof farmPrinter.systemChecks !== "undefined") {
//       farmPrinter.systemChecks.cleaning.information.status = "success";
//       farmPrinter.systemChecks.cleaning.information.date = new Date();
//     }
//     this.#printersInformation[farmPrinter.sortIndex] = sortedPrinter;
//   } catch (e) {
//     logger.error(e);
//   }
// }
