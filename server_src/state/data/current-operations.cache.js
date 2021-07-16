const { getEmptyOperationsObject } = require("../../constants/cleaner.constants");

class CurrentOperationsState {
  #currentOperations = getEmptyOperationsObject();

  async sortCurrentOperations(farmPrinters) {
    const complete = [];
    const active = [];
    const idle = [];
    const offline = [];
    const disconnected = [];
    const progress = [];
    const operations = [];
    try {
      for (let i = 0; i < farmPrinters.length; i++) {
        const printer = farmPrinters[i];
        if (typeof printer !== "undefined") {
          const name = printer.printerName;

          if (typeof printer.printerState !== "undefined") {
            if (printer.printerState.colour.category === "Idle") {
              idle.push(printer._id);
            }
            if (printer.printerState.colour.category === "Offline") {
              offline.push(printer._id);
            }
            if (printer.printerState.colour.category === "Disconnected") {
              disconnected.push(printer._id);
            }
          }

          if (typeof printer.printerState !== "undefined" && printer.currentJob != null) {
            // TODO toString error if not present
            let id = printer._id;
            id = id.toString();
            if (printer.printerState.colour.category === "Complete") {
              complete.push(printer._id);
              progress.push(printer.currentJob.progress);
              operations.push({
                index: id,
                name,
                progress: Math.floor(printer.currentJob.progress),
                progressColour: "success",
                timeRemaining: printer.currentJob.printTimeRemaining,
                fileName: printer.currentJob.fileDisplay
              });
            }

            if (
              printer.printerState.colour.category === "Active" &&
              typeof printer.currentJob !== "undefined"
            ) {
              active.push(printer._id);
              progress.push(printer.currentJob.progress);
              operations.push({
                index: id,
                name,
                progress: Math.floor(printer.currentJob.progress),
                progressColour: "warning",
                timeRemaining: printer.currentJob.printTimeRemaining,
                fileName: printer.currentJob.fileDisplay
              });
            }
          }
        }
      }

      const actProg = progress.reduce((a, b) => a + b, 0);

      this.#currentOperations.count.farmProgress = Math.floor(actProg / progress.length);

      if (isNaN(this.#currentOperations.count.farmProgress)) {
        this.#currentOperations.count.farmProgress = 0;
      }
      if (this.#currentOperations.count.farmProgress === 100) {
        this.#currentOperations.count.farmProgressColour = "success";
      } else {
        this.#currentOperations.count.farmProgressColour = "warning";
      }

      this.#currentOperations.count.printerCount = farmPrinters.length;
      this.#currentOperations.count.complete = complete.length;
      this.#currentOperations.count.active = active.length;
      this.#currentOperations.count.offline = offline.length;
      this.#currentOperations.count.idle = idle.length;
      this.#currentOperations.count.disconnected = disconnected.length;

      this.#currentOperations.operations = _.orderBy(operations, ["progress"], ["desc"]);
    } catch (err) {
      logger.error(`Current Operations issue: ${err}`);
    }
  }
}
