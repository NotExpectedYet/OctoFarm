const { createController } = require("awilix-express");
const { AppConstants } = require("../app.constants");
const Logger = require("../handlers/logger.js");
const isDocker = require("is-docker");

const isPm2Safe =
  "PM2_HOME" in process.env || "PM2_JSON_PROCESSING" in process.env || "PM2_CLI" in process.env;

class FallbackIssueController {
  logger = new Logger("OctoFarm-Fallback-Server");

  /**
   * A Node 12 compatible route
   */
  index(req, res) {
    res.render("nodeVersionIssue", {
      page: "Node Version Issue",
      octoFarmPageTitle:
        process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY] || AppConstants.defaultOctoFarmPageTitle,
      isDocker: isDocker(),
      isPm2: isPm2Safe,
      os: process.env.OS,
      npmPackageJson: process.env[AppConstants.VERSION_KEY],
      nodeVersion: process.version
    });
  }

  /**
   * Note this is a required placeholder to keep the loading screen at bay.
   * @param req
   * @param res
   */
  safeAmIAlive(req, res) {
    res.json({
      ok: true,
      isDockerContainer: isDocker(),
      isPm2: isPm2Safe,
      os: process.env.OS
    });
  }
}

// prettier-ignore
module.exports = createController(FallbackIssueController)
  .prefix("/")
  .before([])
  .get("", "index")
  .get("/serverChecks/amialive", "safeAmIAlive");
