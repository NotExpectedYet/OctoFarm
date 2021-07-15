const prettyHelpers = require("../../views/partials/functions/pretty.js");
const { createController } = require("awilix-express");
const isDocker = require("is-docker");
const { ensureAuthenticated } = require("../middleware/auth");
const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { getDefaultDashboardSettings } = require("../constants/client-settings.constants");
const OctoFarmManager = require("../state/octofarm.manager");
const { fetchMongoDBConnectionString } = require("../../app-env");
const { isPm2, isNodemon, isNode } = require("../utils/env.utils.js");

const viewSystem = ({
  serverVersion,
  octoFarmPageTitle,
  systemInfoStore,
  settingsStore,
  octofarmUpdateService
}) => ({
  index: async (req, res) => {
    const clientSettings = settingsStore.getClientSettings();
    const serverSettings = settingsStore.getServerSettings();
    const systemInformation = await systemInfoStore.querySystemInfo();
    const printers = OctoFarmManager.returnFarmPrinters();
    const softwareUpdateNotification = octofarmUpdateService.getUpdateNotificationIfAny();
    let dashboardSettings = clientSettings?.dashboard || getDefaultDashboardSettings();

    res.render("system", {
      name: req.user.name,
      userGroup: req.user.group,
      version: serverVersion,
      page: "System",
      octoFarmPageTitle: octoFarmPageTitle,
      helpers: prettyHelpers,
      printerCount: printers.length,
      clientSettings,
      serverSettings,
      dashboardSettings: dashboardSettings,
      systemInformation,
      db: fetchMongoDBConnectionString(),
      serviceInformation: {
        isDockerContainer: isDocker(),
        isNodemon: isNodemon(),
        isNode: isNode(),
        isPm2: isPm2(),
        update: softwareUpdateNotification
      }
    });
  },
  /**
   * Call slow system information from system info runner
   */
  info: async (req, res) => {
    const systemInformation = await systemInfoStore.queryWithFreshCurrentProcess();
    res.send(systemInformation);
  }
});

// prettier-ignore
module.exports = createController(viewSystem)
  .prefix("/system")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("", "index")
  .get("/info", "info");
