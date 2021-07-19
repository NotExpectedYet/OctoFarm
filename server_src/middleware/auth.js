// Find server Settings
const ServerSettings = require("../models/ServerSettings.js");

module.exports = {
  async ensureAuthenticated(req, res, next) {
    const serverSettings = await ServerSettings.find({});
    if (!!serverSettings && serverSettings.length > 0) {
      if (serverSettings[0].server.loginRequired === false) {
        return next();
      }
      if (req.isAuthenticated()) {
        return next();
      }
    }
    req.flash("error_msg", "Please log in to view this resource");
    res.redirect("/users/login");
  }
};
