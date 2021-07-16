const { stringify } = require("flatted");
const Logger = require("../handlers/logger");

class PrinterSseTask {
  #printerViewSSEHandler;
  #printersStore;
  #printerTickerStore;

  #aggregateSizeCounter = 0;
  #aggregateWindowLength = 100;
  #aggregateSizes = [];
  #rounding = 2;
  #logger = new Logger("Printer-SSE-task");

  constructor({ printerViewSSEHandler, printerTickerStore, printersStore }) {
    this.#printerViewSSEHandler = printerViewSSEHandler;
    this.#printersStore = printersStore;
    this.#printerTickerStore = printerTickerStore;
  }

  byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
  }

  async run() {
    const currentIssueList = this.#printerTickerStore.getIssueList();
    const printerStates = this.#printersStore.getPrinters();
    const serializablePrinterStates = printerStates.map((s) => s.toFlat());

    // TODO remove this useless data client-side
    const printerControlList = serializablePrinterStates.map((sp) => ({
      printerName: sp.printerName,
      printerID: sp._id,
      state: sp.printerState.colour
    }));

    const sseData = {
      printersInformation: serializablePrinterStates,
      printerControlList,
      currentTickerList: currentIssueList
    };

    const serializedData = JSON.stringify(sseData);
    const transportDataSize = this.byteCount(serializedData);
    this.updateAggregator(transportDataSize);
    this.#printerViewSSEHandler.send(serializedData);
  }

  updateAggregator(transportDataLength) {
    if (this.#aggregateSizeCounter >= this.#aggregateWindowLength) {
      const summedPayloadSize = this.#aggregateSizes.reduce((t, n) => (t += n));
      const averagePayloadSize = summedPayloadSize / 1000 / this.#aggregateWindowLength;
      this.#logger.info(
        `Printer SSE metrics ${averagePayloadSize.toFixed(this.#rounding)} kB [${
          this.#aggregateWindowLength
        } TX avg].`
      );
      this.#aggregateSizeCounter = 0;
      this.#aggregateSizes = [];
    }

    this.#aggregateSizes.push(transportDataLength);
    ++this.#aggregateSizeCounter;
  }
}

module.exports = {
  PrinterSseTask
};
