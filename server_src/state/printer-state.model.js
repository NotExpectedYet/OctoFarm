const { NotImplementedException } = require("../exceptions/runtime.exceptions");
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
  #websocketAdapter;
  #messageSourceSubject;
  #websocketAdapterType;
  #sessionUser;
  #sessionKey;

  #stepRate = 10;
  #systemChecks = getSystemChecksDefault();
  #alerts = null;

  #entityData;

  // We could split this off to a substate cache container as this data is hot from OP
  #gcodeScripts;
  #octoPrintVersion;
  #octoPrintSystemInfo;
  #currentProfile;
  #octoPi;

  // New idea to enable/disable printers
  // enabled = false;

  constructor(printerDocument) {
    this.#id = printerDocument._id.toString();
    this.#entityData = Object.freeze({
      ...printerDocument._doc
    });
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
      octoPrintSystemInfo: {
        "printer.firmware": "klippah"
      },
      currentProfile: {}, // TODO this should not decide client 'Printer' column (octoPrintSystemInfo)
      otherSettings: {}, //? temperatureTriggers + webcamSettings
      octoPi: {
        version: "sure",
        model: "American Pi"
      },

      // Related document query - cached from db
      groups: [],

      // Unmapped data - comes from database model so needs work
      octoPrintVersion: this.#entityData.octoPrintVersion,
      sortIndex: this.#entityData.sortIndex,
      printerName: this.#entityData.settingsApperance.name,
      group: this.#entityData.group
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

  getLoginDetails() {
    return {
      printerURL: this.#entityData.printerURL,
      apikey: this.#entityData.apikey
    };
  }

  setWebsocketState(state) {
    // A function to be implemented for setting the state of the websocket quickly mapping to description and colour
    // state: "tentative_boot", "tentative_preconnect", "tentative_postconnect", etc.

    throw new NotImplementedException();
  }

  setWebsocketTentativeState() {
    this.#webSocket = "info";
    this.#webSocketDescription = "Awaiting current websocket attempt to end...";
  }

  bindWebSocketAdapter(adapterType) {
    if (!!this.#websocketAdapter) {
      throw new Error(
        `This websocket adapter was already bound with type '${
          this.#websocketAdapterType
        }'. Please reset it first with 'resetWebSocketAdapter' if you're switching over dynamically.`
      );
    }
    if (!this.#sessionUser || !this.#sessionKey) {
      throw new Error(
        "Printer State 'bindWebSocketAdapter' was called without 'sessionUser' or 'sessionKey' set-up correctly."
      );
    }

    this.#websocketAdapterType = adapterType?.name;
    this.#websocketAdapter = new adapterType({
      id: this.id,
      webSocketURL: this.#entityData.webSocketURL,
      currentUser: this.#sessionUser,
      sessionkey: this.#sessionKey,
      throttle: 2
    });

    this.#messageSourceSubject = this.#websocketAdapter.getMessages$();
  }

  /**
   * Connect the adapter to the configured transport using the constructor printer document and the bindWebSocketAdapter calls
   */
  connectAdapter() {
    if (!this.#websocketAdapter) {
      throw new Error(
        `The websocket adapter was not provided. Please reset it first with 'bindWebSocketAdapter' to connect to it.`
      );
    }
    this.#messageSourceSubject.subscribe(
      (r) => {
        // console.log(
        //   `Printer WS msg handler ${r.header} [${this.#entityData.settingsApperance.name}]`
        // );
      },
      (e) => {
        console.log("err");
      },
      (c) => {
        console.log("RxJS Subject WS complete");
      }
    );
  }

  /**
   * Reset the type of adapter provided, saving/sending state, disposing and closing the sockets.
   */
  resetWebSocketAdapter() {
    // Call any closing message handlers now
    // ...
    this.#websocketAdapter.close();

    // Reset
    this.#websocketAdapter = undefined;
    this.#websocketAdapterType = undefined;
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

  setApiSuccessState() {
    this.#systemChecks.api.status = "success";
    this.#systemChecks.api.date = new Date();
  }

  setApiLoginSuccessState(sessionUser, sessionKey) {
    this.#sessionUser = sessionUser;
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
}

module.exports = PrinterStateModel;

// static async setupWebSocket(id, skipAPICheck) {
//   const pState = this.getPrinter(id);
//
//   const ws = new WebSocketClient();
//   pState.attachWebsocketClient(ws);
//
//   try {
//     // TODO add internal catch in case of bad connection
//     let isGlobalApiKey = await this.#octoPrintService.checkApiKeyIsGlobal(printer, false);
//     if (isGlobalApiKey) {
//       throw new Error(
//         "This printer was setup with a global API Key. This is a bad configuration state."
//       );
//     }
//
//     // Make a connection attempt, and grab current user.
//     let adminUsername = await this.#octoPrintService.getAdminUserOrDefault(pState, false);
//     await PrinterService.savePrinterAdminUsername(pState.id, adminUsername);
//
//     pState.setApiSuccessState();
//
//     PrinterTickerStore.addIssue(
//       pState,
//       `Attempting passive login for ${pState.currentUser}`,
//       "Active"
//     );
//
//     const loginResponse = await this.octoPrintService.login(pState, false).then((r) => r.json());
//     if (!loginResponse?.session) {
//       throw new Error("OctoPrint login didnt return a sessionKey.");
//     }
//
//     pState.setApiLoginSuccessState(loginResponse.session);
//     PrinterTickerStore.addIssue(
//       pState,
//       `Passive Login with user: ${pState.currentUser}`,
//       "Complete"
//     );
//
//     // Not tolerated... hogs system resources uselessly
//     // await Runner.getSystem(id);
//     // await Runner.getSettings(id);
//     // await Runner.getProfile(id);
//     // await Runner.getState(id);
//     // await Runner.getOctoPrintSystemInfo(id);
//     // await Runner.getPluginList(id);
//     // await Runner.getUpdates(id);
//     // if (typeof dbPrinter.fileList === "undefined" || typeof dbPrinter.storage === "undefined") {
//     //   await Runner.getFiles(id, true);
//     // } else {
//     //   const currentFilament = await Runner.compileSelectedFilament(
//     //     dbPrinter.selectedFilament,
//     //     i
//     //   );
//     //   FileClean.generate(dbPrinter, currentFilament);
//     //   FileClean.statistics(farmPrinters);
//     // }
//
//     // Connection to API successful, gather initial data and setup websocket.
//     PrinterTickerStore.addIssue(dbPrinter, "API checks successful", "Complete");
//     await pState.openWebsocket(`${dbPrinter.webSocketURL}/sockjs/websocket`, i);
//
//     // } else if (usersResponse.status === 503 || usersResponse.status === 404)
//     // else 503/404 => No Connection "503" (WTF why is not found here...)
//     // else 502 => booting "ECONNREFUSED"
//     // else disconnected "NO-API" (We gave up, no internet?)
//   } catch (e) {
//     switch (e.code) {
//       case "NO-API":
//         try {
//           logger.error(
//             e.message,
//             `Couldn't grab initial connection for Printer: ${pState.printerURL}`
//           );
//           PrinterTickerStore.addIssue(
//             pState,
//             `${e.message}: API issues... halting!`,
//             "Disconnected"
//           );
//           pState.state = "No-API";
//           pState.stateColour = PrinterManager.getColour("No-API");
//           pState.hostState = "Online";
//           pState.hostStateColour = PrinterManager.getColour("Online");
//           pState.webSocket = "danger";
//           pState.stateDescription =
//             "Could not connect to OctoPrints API please correct and manually refresh your printer";
//           pState.hostDescription = "Host is Online";
//           pState.webSocketDescription = "Websocket Offline";
//           if (typeof pState !== "undefined") {
//             PrinterClean.generate(pState, serverSettings.filamentManager);
//           }
//         } catch (e) {
//           logger.error(
//             `Couldn't set state of missing printer, safe to ignore: ${pState.index}: ${pState.printerURL}`
//           );
//         }
//         break;
//       case "999":
//         try {
//           logger.error(
//             e.message,
//             `Please generate an Application or User API Key to connect: ${pState.printerURL}`
//           );
//           PrinterTickerStore.addIssue(
//             pState,
//             `${e.message}: Please generate an Application or User API Key to connect...`,
//             "Disconnected"
//           );
//           pState.state = "Incorrect API Key";
//           pState.stateColour = PrinterManager.getColour("Offline");
//           pState.hostState = "Online";
//           pState.hostStateColour = PrinterManager.getColour("Online");
//           pState.webSocket = "danger";
//           pState.stateDescription = "OctoPrint is Offline";
//           pState.hostDescription = "Host is Online";
//           pState.webSocketDescription = "Websocket Offline";
//           if (typeof pState !== "undefined") {
//             PrinterClean.generate(pState, serverSettings.filamentManager);
//           }
//         } catch (e) {
//           logger.error("Couldn't set state of missing printer, safe to ignore");
//         }
//         break;
//       case "ECONNREFUSED":
//         try {
//           logger.error(
//             e.message,
//             `Couldn't grab initial connection for Printer: ${pState.printerURL}`
//           );
//           PrinterTickerStore.addIssue(
//             pState,
//             `${e.message}: Connection refused, trying again in: ${
//               serverSettings.timeout.apiRetry / 1000
//             } seconds`,
//             "Disconnected"
//           );
//           pState.state = "Offline";
//           pState.stateColour = PrinterManager.getColour("Offline");
//           pState.hostState = "Online";
//           pState.hostStateColour = PrinterManager.getColour("Online");
//           pState.webSocket = "danger";
//           pState.stateDescription = "OctoPrint is Offline";
//           pState.hostDescription = "Host is Online";
//           pState.webSocketDescription = "Websocket Offline";
//           if (typeof pState !== "undefined") {
//             PrinterClean.generate(pState, serverSettings.filamentManager);
//           }
//         } catch (e) {
//           logger.error("Couldn't set state of missing printer, safe to ignore");
//         }
//
//         timeout = serverSettings.timeout;
//         setTimeout(function () {
//           PrinterManager.setupWebSocket(id);
//         }, timeout.apiRetry);
//
//         break;
//       case "ENOTFOUND":
//         try {
//           logger.error(
//             e.message,
//             `Couldn't grab initial connection for Printer: ${pState.printerURL}`
//           );
//           PrinterTickerStore.addIssue(
//             pState,
//             `${e.message}: Host not found, halting...`,
//             "Disconnected"
//           );
//           pState.state = "Offline";
//           pState.stateColour = PrinterManager.getColour("Offline");
//           pState.hostState = "Online";
//           pState.hostStateColour = PrinterManager.getColour("Online");
//           pState.webSocket = "danger";
//           pState.stateDescription = "OctoPrint is Offline";
//           pState.hostDescription = "Host is Online";
//           pState.webSocketDescription = "Websocket Offline";
//           if (typeof pState !== "undefined") {
//             PrinterClean.generate(pState, serverSettings.filamentManager);
//           }
//         } catch (e) {
//           logger.error("Couldn't set state of missing printer, safe to ignore");
//         }
//         break;
//       case "DELETED":
//         logger.error(e.message, "Printer Deleted... Do not retry to connect");
//         break;
//       default:
//         try {
//           logger.error(
//             e.message,
//             `Couldn't grab initial connection for Printer: ${pState.printerURL}`
//           );
//           PrinterTickerStore.addIssue(
//             pState,
//             `${e.message} retrying in ${timeout.apiRetry / 1000} seconds`,
//             "Disconnected"
//           );
//           pState.state = "Offline";
//           pState.stateColour = PrinterManager.getColour("Offline");
//           pState.hostState = "Shutdown";
//           pState.hostStateColour = PrinterManager.getColour("Shutdown");
//           pState.webSocket = "danger";
//           pState.stateDescription = "OctoPrint is Offline";
//           pState.hostDescription = "Host is Shutdown";
//           pState.webSocketDescription = "Websocket Offline";
//         } catch (e) {
//           logger.error(
//             `Couldn't set state of missing printer, safe to ignore: ${pState.index}: ${pState.printerURL}`
//           );
//         }
//         if (typeof pState !== "undefined") {
//           PrinterClean.generate(pState, serverSettings.filamentManager);
//         }
//         timeout = serverSettings.timeout;
//         setTimeout(function () {
//           PrinterManager.setupWebSocket(id);
//         }, timeout.apiRetry);
//         break;
//     }
//   }
//   if (typeof pState !== "undefined") {
//     PrinterClean.generate(pState, serverSettings.filamentManager);
//   }
//
//   return true;
// }

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
