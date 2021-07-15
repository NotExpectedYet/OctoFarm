const { createController } = require("awilix-express");
const passport = require("passport");
const Logger = require("../handlers/logger.js");

class ViewLoginController {
  #settingsStore;
  #userTokenService;
  #octoFarmPageTitle;

  #logger = new Logger("OctoFarm-API");

  constructor({ settingsStore, octoFarmPageTitle, userTokenService }) {
    this.#settingsStore = settingsStore;
    this.#octoFarmPageTitle = octoFarmPageTitle;
    this.#userTokenService = userTokenService;
  }

  async index(req, res) {
    const serverSettings = this.#settingsStore.getServerSettings();

    res.render("login", {
      page: "Login",
      octoFarmPageTitle: this.#octoFarmPageTitle,
      registration: serverSettings.server.registration,
      serverSettings: serverSettings
    });
  }

  async login(req, res, next) {
    if (!req.body.remember_me) {
      return next();
    }

    await this.#userTokenService.issueTokenWithDone(req.user, function (err, token) {
      if (err) {
        return next(err);
      }
      res.cookie("remember_me", token, {
        path: "/",
        httpOnly: true,
        maxAge: 604800000
      });
      return next();
    });
  }

  logout(req, res) {
    req.logout();
    req.flash("success_msg", "You are logged out");
    res.redirect("/users/login");
  }
}

module.exports = createController(ViewLoginController)
  .prefix("/users")
  .before([])
  .get("/login", "index")
  .post("/login", "login", {
    before: [
      passport.authenticate("local", {
        // Dont add or we wont reach remember_me cookie successRedirect: "/dashboard",
        failureRedirect: "/users/login",
        failureFlash: true
      })
    ],
    after: [(req, res) => res.redirect("/dashboard")]
  })
  .get("/logout", "logout");
