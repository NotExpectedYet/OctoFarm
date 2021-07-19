const Logger = require("../handlers/logger");
const OctoPrintWebSocketAdapter = require("../services/octoprint/octoprint-websocket.adapter");
const OctoprintRxjsWebsocketAdapter = require("../services/octoprint/octoprint-rxjs-websocket.adapter");
const { OctoprintApiClientService } = require("../services/octoprint/octoprint-api-client.service");

class PrinterWebsocketTask {
  #printersStore;
  #settingsStore;
  #octoPrintService;

  #$event;

  #logger = new Logger("Printer-Websocket-Task");

  constructor({ printersStore, settingsStore }) {
    this.#printersStore = printersStore;
    this.#settingsStore = settingsStore;
    this.#octoPrintService = new OctoprintApiClientService();
  }

  async run() {
    const startTime = Date.now();

    const printerStates = this.#printersStore.getPrinters();
    for (let printerState of printerStates) {
      try {
        await this.setupPrinterConnection(printerState);
      } catch (e) {
        console.log("printer failed to connect");
      }
    }

    const duration = Date.now() - startTime;

    this.#logger.info(
      `successfully set up ${printerStates.length} websocket adapters in ${duration}ms.`
    );
  }

  async setupPrinterConnection(printerState) {
    const loginDetails = printerState.getLoginDetails();
    const loginResponse = await this.#octoPrintService
      .login(loginDetails, true)
      .then((r) => r.json());

    if (!loginResponse?.session) {
      throw new Error("OctoPrint login didnt return a sessionKey.");
    }

    printerState.setApiLoginSuccessState(loginResponse.name, loginResponse?.session);
    printerState.bindWebSocketAdapter(OctoprintRxjsWebsocketAdapter);

    // Delaying or staggering this will speed up startup tasks - ~90 to 150ms per printer on uncongested (W)LAN
    printerState.connectAdapter();
  }
}

module.exports = PrinterWebsocketTask;
