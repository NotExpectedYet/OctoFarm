const express = require("express");
const Logger = require("../../server_src/lib/logger.js");
const isDocker = require("is-docker");
const { AppConstants } = require("../app.constants");

const router = express.Router();
const logger = new Logger("OctoFarm-Fallback-Server");

const isPm2Safe =
  "PM2_HOME" in process.env ||
  "PM2_JSON_PROCESSING" in process.env ||
  "PM2_CLI" in process.env;
/**
 * A Node 12 compatible route
 */
router.get("/", (req, res) =>
  res.render("nodeVersionIssue", {
    page: "Node Version Issue",
    octoFarmPageTitle:
      process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY] ||
      AppConstants.defaultOctoFarmPageTitle,
    isDocker: isDocker(),
    isPm2: isPm2Safe,
    os: process.env.OS,
    npmPackageJson: process.env[AppConstants.VERSION_KEY],
    nodeVersion: process.version
  })
);

router.get("/serverChecks/amialive", async (req, res) => {
  res.json({
    ok: true,
    isDockerContainer: isDocker(),
    isPm2: isPm2Safe,
    os: process.env.OS
  });
});

module.exports = router;
