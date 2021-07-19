const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../../middleware/auth");
const Logger = require("../../handlers/logger.js");

class DatabaseController {
  #logger = new Logger("OctoFarm-API");

  constructor({}) {}

  async deleteSchema(req, res) {
    const databaseName = req.params.name;
    await Runner.pause();
    if (databaseName === "nukeEverything") {
      await ServerSettingsDB.deleteMany({});
      await ClientSettingsDB.deleteMany({});
      await HistoryDB.deleteMany({});
      await SpoolsDB.deleteMany({});
      await ProfilesDB.deleteMany({});
      await roomDataDB.deleteMany({});
      await UserDB.deleteMany({});
      await PrinterDB.deleteMany({});
      await AlertsDB.deleteMany({});
      await GcodeDB.deleteMany({});
      res.send({
        message: "Successfully deleted databases, server will restart..."
      });
      logger.info("Database completely wiped.... Restarting server...");
      SystemCommands.rebootOctoFarm();
    } else if (databaseName === "FilamentDB") {
      await SpoolsDB.deleteMany({});
      await ProfilesDB.deleteMany({});
      logger.info("Successfully deleted Filament database.... Restarting server...");
      SystemCommands.rebootOctoFarm();
    } else {
      await eval(databaseName).deleteMany({});
      res.send({
        message: "Successfully deleted " + databaseName + ", server will restart..."
      });
      logger.info(databaseName + " successfully deleted.... Restarting server...");
      SystemCommands.rebootOctoFarm();
    }
  }

  async getSchema(req, res) {
    const databaseName = req.params.name;
    logger.info("Client requests export of " + databaseName);
    let returnedObjects = [];
    if (databaseName === "FilamentDB") {
      returnedObjects.push(await ProfilesDB.find({}));
      returnedObjects.push(await SpoolsDB.find({}));
    } else {
      returnedObjects.push(await eval(databaseName).find({}));
    }
    logger.info("Returning to client database object: " + databaseName);
    res.send({ databases: returnedObjects });
  }
}

// prettier-ignore
module.exports = createController(DatabaseController)
  .prefix("/settings/database")
  .before([ensureAuthenticated])
  .delete("/delete/:name", "deleteSchema")
  .get("/get/:name", "getSchema");
