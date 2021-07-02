module.exports = {
  ensureCurrentUserAndGroup: function (req, res, next) {
    // If login is not required, set default user and admin otherwise pass current user/group.
    if (!req.serverSettingsCache.server.loginRequired) {
      req.user = {
        name: "No User",
        group: "Administrator"
      };
    }
    next();
  }
};
