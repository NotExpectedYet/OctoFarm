const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../middleware/auth");
const RoomData = require("../models/RoomData.js");

class RoomDataController {
  #serverVersion;
  #settingsStore;
  #octoFarmPageTitle;

  constructor({ settingsStore, serverVersion, octoFarmPageTitle }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#octoFarmPageTitle = octoFarmPageTitle;
  }

  async addRoomData(req, res) {
    const enviromentData = req.body;
    const databaseData = new RoomData(enviromentData);
    await databaseData.save();
  }
}

// prettier-ignore
module.exports = createController(RoomDataController)
  .prefix("/input")
  .before([ensureAuthenticated])
  .post("/roomData", "addRoomData");
