const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const prettyHelpers = require("../../views/partials/functions/pretty.js");
const { getHistoryCache } = require("../state/data/history.cache");

const viewHistory = ({ serverVersion, printersStore, octoFarmPageTitle }) => ({
  index: async (req, res) => {
    const printers = await printersStore.getPrinters();

    const historyCache = getHistoryCache();
    const history = historyCache.historyClean;
    const statistics = historyCache.statisticsClean;

    res.render("history", {
      name: req.user.name,
      userGroup: req.user.group,
      version: serverVersion,
      octoFarmPageTitle: octoFarmPageTitle,
      printerCount: printers.length,
      history,
      printStatistics: statistics,
      helpers: prettyHelpers,
      page: "History"
    });
  }
});

// prettier-ignore
module.exports = createController(viewHistory)
  .prefix("/history")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("", "index");
