const Logger = require("../handlers/logger");
const OctoPrintWebSocketAdapter = require("../services/octoprint/octoprint-websocket.adapter");
const { OctoprintApiClientService } = require("../services/octoprint/octoprint-api-client.service");

class PrinterWebsocketTask {
  #printersStore;
  #settingsStore;
  #octoPrintService;

  #logger = new Logger("Printer-Websocket-Task");

  constructor({ printersStore, settingsStore }) {
    this.#printersStore = printersStore;
    this.#settingsStore = settingsStore;
    this.#octoPrintService = new OctoprintApiClientService();
  }

  async run() {
    const startTime = Date.now();

    const printerStates = this.#printersStore.getPrinters();
    for (let pState of printerStates) {
      const loginDetails = pState.getLoginDetails();
      const loginResponse = await this.#octoPrintService
        .login(loginDetails, true)
        .then((r) => r.json());

      if (!loginResponse?.session) {
        throw new Error("OctoPrint login didnt return a sessionKey.");
      }

      pState.setApiLoginSuccessState(loginResponse.name, loginResponse?.session);
      pState.bindWebSocketAdapter(OctoPrintWebSocketAdapter);

      // Delaying or staggering this will speed up startup tasks - ~90 to 150ms per printer on uncongested (W)LAN
      pState.connectAdapter();
    }

    const duration = Date.now() - startTime;

    this.#logger.info(
      `successfully set up ${printerStates.length} websocket adapters in ${duration}ms.`
    );
  }
}

module.exports = PrinterWebsocketTask;
