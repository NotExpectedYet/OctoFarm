module.exports = {
  async ensureCurrentUserAndGroup(req, res, next) {
    const settingsStore = req.container.resolve("settingsStore");
    const serverSettings = settingsStore.getServerSettings();

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
