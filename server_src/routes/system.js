const express = require("express");

const router = express.Router();

const prettyHelpers = require("../../views/partials/functions/pretty.js");
const { SystemRunner } = require("../runners/systemInfo.js");

const isDocker = require("is-docker");
const softwareUpdateChecker = require("../services/octofarm-update.service");
const { ensureAuthenticated } = require("../config/auth");
const { ensureCurrentUserAndGroup } = require("../config/users");
const { AppConstants } = require("../app.constants");
const {
  getDefaultDashboardSettings
} = require("../lib/providers/settings.constants");
const { Runner } = require("../runners/state");
const { fetchMongoDBConnectionString } = require("../../app-env");
const { isPm2, isNodemon, isNode } = require("../utils/env.utils.js");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean");

router.get(
  "/",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const clientSettings = await SettingsClean.returnClientSettings();
    const serverSettings = await SettingsClean.returnSystemSettings();
    const systemInformation = await SystemRunner.querySystemInfo();
    const printers = Runner.returnFarmPrinters();
    const softwareUpdateNotification =
      softwareUpdateChecker.getUpdateNotificationIfAny();
    let dashboardSettings =
      clientSettings?.dashboard || getDefaultDashboardSettings();

    res.render("system", {
      name: req.user.name,
      userGroup: req.user.group,
      version: process.env[AppConstants.VERSION_KEY],
      printerCount: printers.length,
      page: "System",
      octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
      helpers: prettyHelpers,
      clientSettings,
      serverSettings,
      systemInformation,
      db: fetchMongoDBConnectionString(),
      dashboardSettings: dashboardSettings,
      serviceInformation: {
        isDockerContainer: isDocker(),
        isNodemon: isNodemon(),
        isNode: isNode(),
        isPm2: isPm2(),
        update: softwareUpdateNotification
      }
    });
  }
);

/**
 * Acquire system information from system info runner
 */
router.get("/info", ensureAuthenticated, async (req, res) => {
  const systemInformation = await SystemRunner.queryWithFreshCurrentProcess();
  res.send(systemInformation);
});

module.exports = router;
