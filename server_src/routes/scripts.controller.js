const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../middleware/auth");
const Logger = require("../handlers/logger.js");
const Alerts = require("../models/Alerts");

class ScriptsController {
  #serverVersion;
  #octoFarmPageTitle;
  #settingsStore;
  #scriptCheckService;

  logger = new Logger("OctoFarm-API");

  constructor({ settingsStore, serverVersion, scriptCheckService, octoFarmPageTitle }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#octoFarmPageTitle = octoFarmPageTitle;
    this.#scriptCheckService = scriptCheckService;
  }

  async get(req, res) {
    const alerts = await Alerts.find({});
    res.send({ alerts: alerts, status: 200 });
  }

  async delete(req, res) {
    let id = req.params.id;
    await Alerts.deleteOne({ _id: id })
      .then((response) => {
        res.send({ alerts: "success", status: 200 });
      })
      .catch((err) => {
        console.log(err);
        res.send({ alerts: "error", status: 500 });
      });
  }

  async test(req, res) {
    const opts = req.body;
    let testFire = await this.#scriptCheckService.test(opts.scriptLocation, opts.message);
    res.send({ testFire: testFire, status: 200 });
  }

  async save(req, res) {
    const opts = req.body;
    let save = await this.#scriptCheckService.save(
      opts.printer,
      opts.trigger,
      opts.message,
      opts.scriptLocation
    );
    res.send({ message: save, status: 200 });
  }

  async edit(req, res) {
    const opts = req.body;
    let save = await this.#scriptCheckService.edit(opts);
    res.send({ message: save, status: 200 });
  }
}

// prettier-ignore
module.exports = createController(ScriptsController)
  .prefix("/scripts")
  .before([ensureAuthenticated])
  .get("/get", "get")
  .delete("/delete/:id", "delete")
  .post("/test", "test")
  .post("/save", "save")
  .post("/edit", "edit");
