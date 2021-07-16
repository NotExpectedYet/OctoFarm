const _ = require("lodash");
const Printers = require("../models/Printer.js");
const { getFilterDefaults } = require("../constants/state.constants");
const { PrinterTickerStore } = require("./printer-ticker.store");
const Logger = require("../handlers/logger.js");
const PrinterStateModel = require("./printer-state.model");
const PrinterService = require("../services/printer.service");
const { NotFoundException } = require("../exceptions/runtime.exceptions");

const logger = new Logger("OctoFarm-PrintersStore");

class PrintersStore {
  #settingsStore;
  #printerTickerStore;
  #printerService;

  #printerStates;
  #farmPrintersGroups;

  constructor({ settingsStore, printerTickerStore, printerService }) {
    this.#settingsStore = settingsStore;
    this.#printerService = printerService;
    this.#printerTickerStore = printerTickerStore;

    // Store collections
    this.#printerStates = [];
    this.#farmPrintersGroups = [];
  }

  /**
   * Return a mutable copy of all frozen printers states
   */
  getPrinters() {
    return this.#printerStates;
  }

  validateState() {
    if (!this.#settingsStore) {
      throw new Error(
        "ServerSettings was not injected or was undefined. Cant use PrintersStore in this state."
      );
    }
    if (!this.#printerStates) {
      throw new Error(
        "PrintersStore was not loaded. Cant fire printer loading action. Call 'loadPrintersStore' first."
      );
    }
  }

  async loadPrintersStore() {
    const printerDocs = await Printers.find({}, null, {
      sort: { sortIndex: 1 }
    });

    this.#printerStates = printerDocs.map((p) => new PrinterStateModel(p));

    logger.info(`Loaded ${this.#printerStates.length} printer states`);
    this.generatePrinterGroups();
  }

  getPrinterState(id) {
    this.validateState();

    const printerState = this.#printerStates.find((p) => p.id === id);

    if (!printerState) {
      throw new NotFoundException(`The printer ID ${id} was not generated. This is a bug.`);
    }

    return printerState;
  }

  async setLoadingState() {
    this.validateState();

    this.#printerStates.forEach((printer) => {
      this.#printerTickerStore.addIssue(printer, "Initiating Printer...", "Active");
      PrinterClean.generate(printer, this.#settingsStore.filamentManager);
    });
  }

  generatePrinterGroups() {
    this.#farmPrintersGroups = getFilterDefaults();

    this.#printerStates.forEach((printer) => {
      if (!this.#farmPrintersGroups.includes(`Group: ${printer.group}`)) {
        if (!_.isEmpty(printer.group)) {
          this.#farmPrintersGroups.push(`Group: ${printer.group}`);
        }
      }
    });
  }

  getPrinterGroups() {
    return Object.freeze([...this.#farmPrintersGroups]);
  }

  async generateSortIndices() {
    for (let p = 0; p < this.#printerStates.length; p++) {
      const printer = this.#printerStates[p];
      printer.sortIndex = p;
      this.addLoggedTicker(printer, `Setting sort index ${p} for: ${printer.printerURL}`, "Active");
      await this.#printerService.updateSortIndex(printer._id, p);
    }
  }

  /**
   * @deprecated A list used to sort printers. This is obsolete next minor release.
   * @returns {*[]}
   */
  getPrinterSortingList() {
    const sorted = [];
    for (let p = 0; p < this.#printerStates.length; p++) {
      const sort = {
        sortIndex: this.#printerStates[p].sortIndex,
        actualIndex: p
      };
      sorted.push(sort);
    }
    sorted.sort((a, b) => (a.sortIndex > b.sortIndex ? 1 : -1));
    return sorted;
  }

  addLoggedTicker(printer, message, state) {
    logger.info(message);
    PrinterTickerStore.addIssue(printer, message, state);
  }

  async addPrinter(printer) {
    logger.info("Saving new printer to database");
    const newPrinterDoc = await PrinterService.create(printer);

    logger.info(`Saved new Printer: ${newPrinterDoc.printerURL} with ID ${newPrinterDoc._id}`);

    const newPrinterState = new PrinterStateModel(newPrinterDoc._id);
    this.#printerStates.push(newPrinterState);

    // We should not to this now: Regenerate sort index on printer add...
    // await this.reGenerateSortIndex();
    // We should let the Runner fire a task for doing this in batch
    // await this.setupWebSocket(newPrinter._id);

    return newPrinterState;
  }

  // async flowRate(id, newRate) {
  //   const fprinter = this.getPrinter(id);
  //   fprinter.flowRate = newRate;
  //   const printer = await Printers.findById(id);
  //   printer.flowRate = fprinter.flowRate;
  //   printer.save();
  //   PrinterClean.generate(fprinter, serverSettings.filamentManager);
  // }
  //
  // async feedRate(id, newRate) {
  //   const fprinter = this.getPrinter(id);
  //   fprinter.feedRate = newRate;
  //   const printer = await Printers.findById(id);
  //   printer.feedRate = fprinter.feedRate;
  //   printer.save();
  //   PrinterClean.generate(fprinter, serverSettings.filamentManager);
  // }
  //
  // stepRate(id, newRate) {
  //   const printer = this.getPrinter(id);
  //   printer.stepRate = newRate;
  //   PrinterClean.generate(printer, serverSettings.filamentManager);
  // }

  // returnAllOctoPrintVersions() {
  //   return this.#printersInformation.map((printer) => printer.octoPrintVersion);
  // }
}

module.exports = PrintersStore;
