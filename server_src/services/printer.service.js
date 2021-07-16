const Printers = require("../models/Printer.js");
const printerModel = require("../models/Printer");
const { validateInput } = require("../utils/validators");
const { NotFoundException } = require("../exceptions/runtime.exceptions");

const PRINTER_INPUT_RULES = {
  apikey: "required|minLength:36|maxLength:36|alphaNumeric",
  printerURL: "required|url",
  websocketURL: "required|wsurl",
  camURL: "url"
};

class PrinterService {
  /**
   * Stores a new printer into the database.
   * @param {Object} printer object to create.
   * @throws {Error} If the printer is not correctly provided.
   */
  static async create(printer) {
    await validateInput(printer, PRINTER_INPUT_RULES);

    if (!printer) throw new Error("Missing printer");

    return printerModel.create(printer);
  }

  // W.I.P. with state refactor
  // const generatePrinter = () => {
  // const httpPrefix = secure ? "https" : "http";
  // const wsPrefix = secure ? "https" : "http";
  // this.printerURL = new URL(`${httpPrefix}://${host}:${port}`).href;
  // this.camURL = new URL(`${httpPrefix}://${host}:${port}`).href;
  // this.webSocketURL = new URL(`${wsPrefix}://${host}:${port}`).href;
  // }

  // Modeled by database: dont cache
  // printerName => saved to db
  // powerSettings = getPowerSettingsDefault(); => saved to db, dont cache
  // costSettings = getCostSettingsDefault(); => saved to db, dont cache
  // ip;
  // port;
  // printerURL;
  // webSocketURL;
  // camURL;
  // feedRate = 100;
  // flowRate = 100;
  // sortIndex = null; // Yes this is a design change
  // group = "";
  // currentIdle = 0;
  // currentActive = 0;
  // currentOffline = 0;
  // currentUser
  // selectedFilament = []; // TODO This is not set to Array in schema?
  // octoPrintVersion = "";
  // tempTriggers = {
  //   heatingVariation: 1,
  //   coolDown: 30
  // };
  // dateAdded = Date.now(); // ! some weird undefined check
  // settingsAppearance; // ! startup migration to rename 'settingsApperance'

  // async saveStatePersisted() {
  //   const printer = await Printers.findById(id);
  //   printer.octoPrintVersion = this.octoPrintVersion;
  //   printer.printerName = this.printerName;
  //   printer.camURL = this.camURL;
  //   printer.printerURL = this.printerURL;
  //   printer.webSocketURL = this.webSocketURL;
  //   printer.feedRate = this.feedRate;
  //   printer.flowRate = this.flowRate;
  //   printer.sortIndex = this.sortIndex;
  //   printer.tempTriggers = this.tempTriggers;
  //   printer.dateAdded = this.dateAdded;
  //   printer.currentIdle = this.currentIdle;
  //   printer.currentActive = this.currentActive;
  //   printer.currentOffline = this.currentOffline;
  //   printer.selectedFilament = this.selectedFilament;
  //   printer.powerSettings = this.powerSettings;
  //   printer.alerts = this.alerts;
  //   printer.costSettings = this.costSettings;
  //   await printer.save();
  // }

  // async sortConnection(current) {
  //   if (!current) return null;
  //   return {
  //     baudrate: current.baudrate,
  //     port: current.port,
  //     printerProfile: current.printerProfile
  //   };
  // }

  // grabPrinterName(printer) {
  //   let name = null;
  //   if (!!printer.settingsAppearance) {
  //     if (printer.settingsAppearance.name === "" || printer.settingsAppearance.name === null) {
  //       name = printer.printerURL;
  //     } else {
  //       name = printer.settingsAppearance.name;
  //     }
  //   } else {
  //     name = printer.printerURL;
  //   }
  //   return name;
  // }

  // static sortOtherSettings(temp, webcam, system) {
  //   const otherSettings = {
  //     temperatureTriggers: null,
  //     webCamSettings: null
  //   };
  //   if (typeof temp !== "undefined") {
  //     otherSettings.temperatureTriggers = temp;
  //   }
  //   if (typeof webcam !== "undefined") {
  //     otherSettings.webCamSettings = webcam;
  //   }
  //   if (typeof system !== "undefined") {
  //     otherSettings.system = system;
  //   }
  //
  //   return otherSettings;
  // }

  static updateSortIndex = async (printerId, sortIndex) => {
    const filter = { _id: printerId };
    const update = { sortIndex };
    await Printers.findOneAndUpdate(filter, update, {
      returnOriginal: false
    });
  };

  static savePrinterAdminUsername = async (id, opAdminUserName) => {
    const printer = printerModel.findById(id);
    if (!printer) {
      throw new NotFoundException(`The printer with ID ${id} does not exist in database.`);
    }

    printer.currentUser = opAdminUserName;
    printer.markModified("currentUser");
    await printer.updateOne();
  };

  /**
   * Lists the printers present in the database.
   */
  list = async () => {
    return printerModel.find({});
  };
}

module.exports = PrinterService;
