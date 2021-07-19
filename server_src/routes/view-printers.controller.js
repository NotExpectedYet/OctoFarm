const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const prettyHelpers = require("../../views/partials/functions/pretty.js");

class ViewPrinters {
  #serverVersion;
  #printersStore;
  #octoFarmPageTitle;
  #octofarmUpdateService;

  #sseHandler;

  constructor({
    serverVersion,
    octoFarmPageTitle,
    printersStore,
    printerViewSSEHandler,
    octofarmUpdateService
  }) {
    this.#serverVersion = serverVersion;
    this.#printersStore = printersStore;
    this.#octoFarmPageTitle = octoFarmPageTitle;
    this.#octofarmUpdateService = octofarmUpdateService;
    this.#sseHandler = printerViewSSEHandler;
  }

  async index(req, res) {
    const printers = await this.#printersStore.getPrinters();

    res.render("printerManagement", {
      name: req.user.name,
      userGroup: req.user.group,
      version: this.#serverVersion,
      page: "Printer Manager",
      octoFarmPageTitle: this.#octoFarmPageTitle,
      printerCount: printers.length,
      helpers: prettyHelpers,
      air_gapped: this.#octofarmUpdateService.getAirGapped()
    });
  }

  sse(req, res) {
    this.#sseHandler.handleRequest(req, res);
  }
}

// prettier-ignore
module.exports = createController(ViewPrinters)
  .prefix("/printers")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("", "index")
  .get("/sse", "sse");
