const { SettingsClean } = require("../lib/dataFunctions/settingsClean.js");

module.exports = {
  async ensureCurrentUserAndGroup(req, res, next) {
    const serverSettings = await SettingsClean.returnSystemSettings();

    // If login is not required, set default user and admin otherwise pass current user/group.
    if (!serverSettings?.server?.loginRequired) {
      req.user = {
        name: "No User",
        group: "Administrator"
      };
    }

    next();
  }
};
