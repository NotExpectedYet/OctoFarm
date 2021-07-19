class PrinterInfoTask {
  #printersStore;
  #settingsStore;

  constructor({ printersStore, settingsStore }) {
    this.#printersStore = printersStore;
    this.#settingsStore = settingsStore;
  }

  async run() {
    const serverSettings = this.#settingsStore.getServerSettings();
    // const printersInformation = PrinterClean.listPrintersInformation();
    // await PrinterClean.sortCurrentOperations(printersInformation);
    //
    // await PrinterClean.statisticsStart();
    // const printerList = ['<option value="0">Not Assigned</option>'];
    // farmPrinters.forEach((printer) => {
    //   if (typeof printer.currentProfile !== "undefined" && printer.currentProfile !== null) {
    //     for (let i = 0; i < printer.currentProfile.extruder.count; i++) {
    //       let listing = null;
    //       if (filamentManager) {
    //         if (
    //           printer.printerState.colour.category === "Offline" ||
    //           printer.printerState.colour.category === "Active"
    //         ) {
    //           listing = `<option value="${printer._id}-${i}" disabled>${printer.printerName}: Tool ${i}</option>`;
    //         } else {
    //           listing = `<option value="${printer._id}-${i}">${printer.printerName}: Tool ${i}</option>`;
    //         }
    //       } else {
    //         listing = `<option value="${printer._id}-${i}">${printer.printerName}: Tool ${i}</option>`;
    //       }
    //
    //       printerList.push(listing);
    //     }
    //   }
    // });

    // this.#printerFilamentList = printerList;
  }
}

module.exports = PrinterInfoTask;
