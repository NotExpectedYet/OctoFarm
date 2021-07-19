class PrinterTickerStore {
  #currentIssues = [];
  #octoprintLogs = [];

  #lastIssueId = -1;
  #lastLogId = -1;

  constructor({}) {}

  addOctoPrintLog(printer, message, state, plugin) {
    let id = this.#lastLogId + 1;
    this.#lastLogId++;

    const newLog = {
      id: id,
      date: new Date(),
      message: message,
      printerID: printer._id,
      printer: printer.printerURL,
      state: state,
      pluginDisplay: plugin
    };
    this.#octoprintLogs.push(newLog);
    if (this.#octoprintLogs.length >= 2000) {
      this.#octoprintLogs.shift();
    }
  }

  addIssue(printer, message, state) {
    let id = this.#lastIssueId + 1;
    this.#lastIssueId++;

    const newIssue = {
      id: id,
      date: Date.now(),
      message: message,
      printerID: printer?._id,
      printer: printer.printerURL,
      state: state
    };
    this.#currentIssues.push(newIssue);
    if (this.#currentIssues.length >= 10000) {
      this.#currentIssues.shift();
    }
  }

  returnOctoPrintLogs() {
    return this.#octoprintLogs;
  }

  getIssueList() {
    return this.#currentIssues;
  }
}

module.exports = PrinterTickerStore;
