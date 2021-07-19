const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const prettyHelpers = require("../../views/partials/functions/pretty.js");
const { FilamentClean } = require("../state/data/filamentClean");
const { getHistoryCache } = require("../state/data/history.cache");

const viewFilament = ({ serverVersion, printersStore, octoFarmPageTitle, settingsStore }) => ({
  index: async (req, res) => {
    const historyCache = getHistoryCache();
    const historyStats = historyCache.generateStatistics();

    const printers = printersStore.getPrinters();
    const serverSettings = settingsStore.getServerSettings();
    const statistics = await FilamentClean.getStatistics();
    const spools = await FilamentClean.getSpools();
    const profiles = await FilamentClean.getProfiles();

    res.render("filament", {
      name: req.user.name,
      userGroup: req.user.group,
      version: serverVersion,
      printerCount: printers.length,
      page: "Filament Manager",
      octoFarmPageTitle,
      helpers: prettyHelpers,
      serverSettings,
      spools,
      profiles,
      statistics,
      historyStats
    });
  }
});

// prettier-ignore
module.exports = createController(viewFilament)
  .prefix("/filament")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("", "index");
