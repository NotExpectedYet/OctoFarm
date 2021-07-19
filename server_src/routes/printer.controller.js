const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const Logger = require("../handlers/logger.js");

class PrinterController {
  #printerService;

  #logger = new Logger("OctoFarm-API");

  constructor({ printerService }) {
    this.#printerService = printerService;
  }

  async addPrinter(req, res) {
    const newPrinter = req.body;
    this.#logger.info("Update printers request: ", newPrinter);
    // TODO Validate
    const p = await Runner.addPrinters(newPrinter);
    res.send({ printersAdded: p, status: 200 });
  }

  async updatePrinter(req, res) {
    const printers = req.body;
    this.#logger.info("Update printers request: ", printers);
    // TODO Validate
    const p = await Runner.updatePrinters(printers);
    res.send({ printersAdded: p, status: 200 });
  }

  async removePrinter(req, res) {
    const printers = req.body;
    this.#logger.info("Delete printers request: ", printers);
    const p = await Runner.removePrinter(printers);
    res.send({ printersRemoved: p, status: 200 });
  }

  async setStepChange(req, res) {
    const step = req.body;
    // TODO Validate
    await Runner.stepRate(step.printer, step.newSteps);
    res.send("success");
  }

  async setFlowChange(req, res) {
    const step = req.body;
    // TODO Validate
    await Runner.flowRate(step.printer, step.newSteps);
    res.send("success");
  }

  async setFeedChange(req, res) {
    const step = req.body;
    // TODO Validate
    Runner.feedRate(step.printer, step.newSteps);
    res.send("success");
  }

  async updateSettings(req, res) {
    const settings = req.body;
    // TODO Validate
    logger.info("Update printers request: ", settings);
    const updateSettings = await Runner.updateSettings(settings);
    res.send({ status: updateSettings.status, printer: updateSettings.printer });
  }

  async refreshSettings(req, res) {
    const id = req.body.i;
    if (!id) {
      logger.error("Printer Settings: No ID key was provided");
      res.statusMessage = "No ID key was provided";
      res.sendStatus(400);
      return;
    }
    try {
      await Runner.getLatestOctoPrintSettingsValues(id);
      let printerInformation = PrinterClean.getPrintersInformationById(id);
      res.send(printerInformation);
    } catch (e) {
      logger.error(`The server couldn't update your printer settings! ${e}`);
      res.statusMessage = `The server couldn't update your printer settings! ${e}`;
      res.sendStatus(500);
    }
  }

  async killPowerSettings(req, res) {
    const printerID = req.params.id;
    // TODO Validate
    const updateSettings = await Runner.killPowerSettings(printerID);
    res.send({ updateSettings });
  }

  find(req, res) {
    return this.#printerService.list().then((result) => {
      res.send(result);
    });
  }

  async reconnectOctoPrint(req, res) {
    const data = req.body;
    if (data.id === null) {
      logger.info("Rescan All OctoPrint Requests: ", data);
      const printers = await Runner.returnFarmPrinters();
      for (let i = 0; i < printers.length; i++) {
        await Runner.reScanOcto(printers[i]._id);
      }
      logger.info("Full re-scan of OctoFarm completed");
      res.send({ msg: "Started a full farm rescan." });
    } else {
      logger.info("Rescan OctoPrint Requests: ", data);
      const reScan = await Runner.reScanOcto(data.id);
      logger.info("Rescan OctoPrint complete: ", reScan);
      res.send({ msg: reScan });
    }
  }

  async printerInfo(req, res) {
    const id = req.body.i;
    let returnedPrinterInformation;
    if (!id) {
      returnedPrinterInformation = PrinterClean.listPrintersInformation();
    } else {
      returnedPrinterInformation = PrinterClean.getPrintersInformationById(id);
    }
    res.send(returnedPrinterInformation);
  }

  async updateSortIndex(req, res) {
    const data = req.body;
    logger.info("Update filament sorting request: ", data);
    Runner.updateSortIndex(data);
  }

  async connectionLogs(req, res) {
    let id = req.params.id;
    logger.info("Grabbing connection logs for: ", id);
    let connectionLogs = await Runner.returnPrinterLogs(id);
    res.send(connectionLogs);
  }

  async pluginList(req, res) {
    let id = req.params.id;
    if (id !== "all") {
      logger.info("Grabbing plugin list for: ", id);
      let pluginList = await Runner.returnPluginList(id);
      res.send(pluginList);
      return;
    }
    logger.info("Grabbing global plugin list");
    let pluginList = await Runner.returnPluginList();
    res.send(pluginList);
  }
}

// prettier-ignore
module.exports = createController(PrinterController)
  .prefix("/printer")
  .before([ensureAuthenticated])
  .post("/add", "addPrinter")
  .post("/update", "updatePrinter")
  .post("/remove", "removePrinter")
  .post("/stepChange", "setStepChange")
  .post("/flowChange", "setFlowChange")
  .post("/feedChange", "setFeedChange")
  .post("/updateSettings", "updateSettings")
  .post("/refreshSettings", "refreshSettings")
  .post("/reconnectOctoPrint", "reconnectOctoPrint")
  .get("/printerInfo", "printerInfo")
  .get("/connectionLogs/:id", "connectionLogs")
  .get("/pluginList/:id", "pluginList")
  .post("/updateSortIndex", "updateSortIndex")
  .post("/killPowerSettings/:id", "killPowerSettings")
  .get("", "find");
