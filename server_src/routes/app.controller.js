const { createController } = require("awilix-express");

class AppController {
  #serverVersion;
  #settingsStore;
  #printersStore;
  #octoFarmPageTitle;

  constructor({ settingsStore, printersStore, serverVersion, octoFarmPageTitle }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#printersStore = printersStore;
    this.#octoFarmPageTitle = octoFarmPageTitle;
  }

  welcome(req, res) {
    const serverSettings = this.#settingsStore.getServerSettings();
    if (serverSettings.server.loginRequired === false) {
      res.redirect("/dashboard");
    } else {
      if (req.isAuthenticated()) {
        res.redirect("/dashboard");
      } else {
        res.render("welcome", {
          page: "Welcome",
          octoFarmPageTitle: this.#octoFarmPageTitle,
          registration: serverSettings.server.registration,
          serverSettings
        });
      }
    }
  }
}

// prettier-ignore
module.exports = createController(AppController)
  .prefix("/")
  .before([])
  //.get("wizard, "wizard")
  .get("", "welcome");
