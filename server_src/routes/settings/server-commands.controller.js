const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../../middleware/auth");
const Logger = require("../../handlers/logger.js");

class ServerCommandsController {
  #logger = new Logger("OctoFarm-API");

  constructor({}) {}

  async checkUpdate(req, res) {
    await checkReleaseAndLogUpdate();
    const softwareUpdateNotification = getUpdateNotificationIfAny();
    res.send(softwareUpdateNotification);
  }

  async updateOctoFarm(req, res) {
    let clientResponse = {
      haveWeSuccessfullyUpdatedOctoFarm: false,
      statusTypeForUser: "error",
      message: ""
    };
    let force = req?.body;
    if (
      !force ||
      typeof force?.forcePull !== "boolean" ||
      typeof force?.doWeInstallPackages !== "boolean"
    ) {
      res.sendStatus(400);
      throw new Error("forceCheck object not correctly provided or not boolean");
    }

    try {
      clientResponse = await SystemCommands.checkIfOctoFarmNeedsUpdatingAndUpdate(
        clientResponse,
        force
      );
    } catch (e) {
      clientResponse.message = "Issue with updating | " + e?.message.replace(/(<([^>]+)>)/gi, "");
      // Log error with html tags removed if contained in response message
      logger.error("Issue with updating | ", e?.message.replace(/(<([^>]+)>)/gi, ""));
    } finally {
      res.send(clientResponse);
    }
  }

  async restartServer(req, res) {
    let serviceRestarted = false;
    try {
      serviceRestarted = await SystemCommands.rebootOctoFarm();
    } catch (e) {
      logger.error(e);
    }
    res.send(serviceRestarted);
  }
}

// prettier-ignore
module.exports = createController(ServerCommandsController)
  .prefix("/settings/server")
  .before([ensureAuthenticated])
  .get("/update/check", "checkUpdate")
  .post("/update/octofarm", "download")
  .post("/restart", "restartServer");
