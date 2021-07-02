const { getServerSettingsCache } = require("../cache/server-settings.cache.js");

module.exports = {
  ensureSystemSettingsCache: function (req, res, next) {
    req.serverSettingsCache =
      getServerSettingsCache().entireServerSettingsObject;
    next();
  }
};
