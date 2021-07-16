const { stringify } = require("flatted");
const Logger = require("../handlers/logger");

class PrinterSseTask {
  #printerViewSSEHandler;
  #printersStore;

  #aggregateSizeCounter = 0;
  #aggregateWindowLength = 100;
  #aggregateSizes = [];
  #rounding = 2;
  #logger = new Logger("Printer-SSE-task");

  constructor({ printerViewSSEHandler, printersStore }) {
    this.#printerViewSSEHandler = printerViewSSEHandler;
    this.#printersStore = printersStore;
  }

  byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
  }

  async run() {
    //     const printersInformation = await PrinterClean.listPrintersInformation();
    //     const printerControlList = await PrinterClean.returnPrinterControlList();
    //     const currentTickerList = await PrinterTicker.returnIssue();
    //
    //     const infoDrop = {
    //       printersInformation,
    //       printerControlList,
    //       currentTickerList
    //     };

    const printerStates = this.#printersStore.getPrinters();
    const serializablePrinterStates = printerStates.map((s) => s.toFlat());
    const sseData = {
      printersInformation: serializablePrinterStates,
      printerControlList: [],
      currentTickerList: []
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
        `Printer SSE transmitted ${averagePayloadSize.toFixed(this.#rounding)} kB [${
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
