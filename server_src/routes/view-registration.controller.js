const { createController } = require("awilix-express");
const Logger = require("../handlers/logger.js");
const User = require("../models/User");

class ViewRegistrationController {
  #settingsStore;
  #octoFarmPageTitle;

  #logger = new Logger("OctoFarm-API");

  #currentUsers;

  constructor({ settingsStore, octoFarmPageTitle }) {
    this.#settingsStore = settingsStore;
    this.#octoFarmPageTitle = octoFarmPageTitle;
  }

  /**
   * TODO move this to another place...
   * @param force
   * @returns {Promise<*>}
   */
  async fetchUsers(force = false) {
    if (!this.#currentUsers || force) {
      this.#currentUsers = await User.find({});
    }
    return this.#currentUsers;
  }

  async index(req, res) {
    let settings = req.container.resolve("settingsStore").getServerSettings();
    if (settings[0].server.registration !== true) {
      return res.redirect("login");
    }

    let currentUsers = await this.fetchUsers();
    res.render("register", {
      page: "Register",
      octoFarmPageTitle: this.#octoFarmPageTitle,
      serverSettings: settings,
      userCount: currentUsers.length
    });
  }

  async register(req, res) {
    const { name, username, password, password2 } = req.body;
    const errors = [];

    let settings = this.#settingsStore.getServerSettings();
    let currentUsers = await this.fetchUsers(true);

    // Check required fields
    if (!name || !username || !password || !password2) {
      errors.push({ msg: "Please fill in all fields..." });
    }

    // Check passwords match
    if (password !== password2) {
      errors.push({ msg: "Passwords do not match..." });
    }

    // Password at least 6 characters
    if (password.length < 6) {
      errors.push({ msg: "Password should be at least 6 characters..." });
    }

    if (errors.length > 0) {
      res.render("register", {
        page: "Login",
        octoFarmPageTitle: this.#octoFarmPageTitle,
        registration: settings.server.registration,
        serverSettings: settings,
        errors,
        name,
        username,
        password,
        password2,
        userCount: currentUsers.length
      });
    } else {
      // Validation Passed
      User.findOne({ username }).then((user) => {
        if (user) {
          // User exists
          errors.push({ msg: "Username is already registered" });
          res.render("register", {
            page: "Login",
            octoFarmPageTitle: this.#octoFarmPageTitle,
            registration: settings.server.registration,
            serverSettings: settings,
            errors,
            name,
            username,
            password,
            password2,
            userCount: currentUsers.length
          });
        } else {
          // Check if first user that's created.
          User.find({}).then((user) => {
            let userGroup = "";
            if (user.length < 1) {
              userGroup = "Administrator";
            } else {
              userGroup = "User";
            }
            const newUser = new User({
              name,
              username,
              password,
              group: userGroup
            });
            // Hash Password
            bcrypt.genSalt(10, (error, salt) =>
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                // Set password to hashed
                newUser.password = hash;
                // Save new User
                newUser
                  .save()
                  .then((user) => {
                    req.flash("success_msg", "You are now registered and can login");
                    const page = "login";
                    res.redirect("/users/login");
                  })
                  .catch((err) => console.log(err));
              })
            );
          });
        }
      });
    }
  }
}

module.exports = createController(ViewRegistrationController)
  .prefix("/users")
  .before([])
  .get("/register", "index")
  .post("/register", "register");
