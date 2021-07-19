const CustomGcode = require("../../models/CustomGcode");
const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../../middleware/auth");
const Logger = require("../../handlers/logger.js");

class CustomGcodeController {
  #logger = new Logger("OctoFarm-API");
  #serverVersion;
  #settingsStore;
  #octoFarmPageTitle;

  constructor({ settingsStore, serverVersion, octoFarmPageTitle }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#octoFarmPageTitle = octoFarmPageTitle;
  }

  deleteGcode(req, res) {
    const scriptId = req.params.id;
    CustomGcode.findByIdAndDelete(scriptId, function (err) {
      if (err) {
        res.send(err);
      } else {
        res.send(scriptId);
      }
    });
  }

  async list(req, res) {
    const all = await CustomGcode.find();
    res.send(all);
  }

  async create(req, res) {
    let newScript = req.body;
    const saveScript = new CustomGcode(newScript);
    await saveScript
      .save()
      .then(res.send(saveScript))
      .catch((e) => res.send(e));
  }

  async edit(req, res) {
    const newObj = req.body;
    let script = await CustomGcode.findById(newObj.id);
    script.gcode = newObj.gcode;
    script.name = newObj.name;
    script.description = newObj.description;
    script.save();
    res.send(script);
  }
}

// prettier-ignore
module.exports = createController(CustomGcodeController)
  .prefix("/settings/customGcode")
  .before([ensureAuthenticated])
  .delete("/delete/:id", "deleteGcode")
  .get("/get/:name", "list")
  .post("/edit", "edit")
  .post("/create", "create");
