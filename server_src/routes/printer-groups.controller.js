const Logger = require("nodemon");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");

class PrinterGroupsController {
  #printerService;
  #printerGroupService;

  #logger = new Logger("OctoFarm-API");

  constructor({ printerService, printerGroupService }) {
    this.#printerService = printerService;
    this.#printerGroupService = printerGroupService;
  }

  async listGroups(req, res) {
    const printers = await Runner.returnFarmPrinters();
    const groups = [];
    for (let i = 0; i < printers.length; i++) {
      await groups.push({
        _id: printers[i]._id,
        group: printers[i].group
      });
    }

    res.send(groups);
  }

  async listNewGroups(req, res) {
    const groups = await this.#printerGroupService.syncPrinterGroups();
    res.json(groups);
  }
}

// prettier-ignore
module.exports = createController(PrinterGroupsController)
  .prefix("/printer-groups")
  .before([ensureAuthenticated])
  .get("/list", "listGroups")
  .get("/list-new", "listNewGroups")
