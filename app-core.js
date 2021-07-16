const express = require("express");
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const ServerSettingsDB = require("./server_src/models/ServerSettings");
const expressLayouts = require("express-ejs-layouts");
const Logger = require("./server_src/lib/logger.js");
const { OctoFarmTasks } = require("./server_src/tasks");
const {
  optionalInfluxDatabaseSetup
} = require("./server_src/lib/influxExport.js");
const { getViewsPath } = require("./app-env");
const {
  PrinterClean
} = require("./server_src/lib/dataFunctions/printerClean.js");
const { ServerSettings } = require("./server_src/settings/serverSettings.js");
const { ClientSettings } = require("./server_src/settings/clientSettings.js");
const { TaskManager } = require("./server_src/runners/task.manager");

function setupExpressServer() {
  let app = express();

  require("./server_src/config/passport.js")(passport);
  app.use(express.json());

  const viewsPath = getViewsPath();

  if (process.env.NODE_ENV === "production") {
    const { getOctoFarmUiPath } = require("@octofarm/client");
    const bundlePath = getOctoFarmUiPath();
    app.use("/assets/dist", express.static(bundlePath));
  }

  app.set("views", viewsPath);
  app.set("view engine", "ejs");
  app.use(expressLayouts);
  app.use(express.static(viewsPath));

  app.use("/images", express.static("./images"));
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(
    session({
      secret: "supersecret",
      resave: true,
      saveUninitialized: true
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(passport.authenticate("remember-me")); // Remember Me!
  app.use(flash());
  app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
  });

  return app;
}

async function ensureSystemSettingsInitiated() {
  logger.info("Checking Server Settings...");

  await ServerSettingsDB.find({}).catch((e) => {
    if (e.message.includes("command find requires authentication")) {
      throw "Database authentication failed.";
    } else {
      throw "Database connection failed.";
    }
  });

  // Setup Settings as connection is established
  const serverSettingsStatus = await ServerSettings.init();
  await ClientSettings.init();

  return serverSettingsStatus;
}

function serveOctoFarmRoutes(app) {
  app.use("/", require("./server_src/routes/index", { page: "route" }));
  app.use(
    "/serverChecks",
    require("./server_src/routes/serverChecks", { page: "route" })
  );
  app.use("/users", require("./server_src/routes/users", { page: "route" }));
  app.use(
    "/printers",
    require("./server_src/routes/printers", { page: "route" })
  );
  app.use(
    "/groups",
    require("./server_src/routes/printerGroups", { page: "route" })
  );
  app.use(
    "/settings",
    require("./server_src/routes/settings", { page: "route" })
  );
  app.use(
    "/printersInfo",
    require("./server_src/routes/SSE-printersInfo", { page: "route" })
  );
  app.use(
    "/dashboardInfo",
    require("./server_src/routes/SSE-dashboard", { page: "route" })
  );
  app.use(
    "/monitoringInfo",
    require("./server_src/routes/SSE-monitoring", { page: "route" })
  );
  app.use(
    "/filament",
    require("./server_src/routes/filament", { page: "route" })
  );
  app.use(
    "/history",
    require("./server_src/routes/history", { page: "route" })
  );
  app.use(
    "/scripts",
    require("./server_src/routes/scripts", { page: "route" })
  );
  app.use(
    "/input",
    require("./server_src/routes/externalDataCollection", { page: "route" })
  );
  app.use("/system", require("./server_src/routes/system", { page: "route" }));
  app.use("/client", require("./server_src/routes/sorting", { page: "route" }));
  app.get("*", function (req, res) {
    console.debug("Had to redirect resource request:", req.originalUrl);
    if (req.originalUrl.endsWith(".min.js")) {
      logger.error("Javascript resource was not found " + req.originalUrl);
      res.status(404);
      res.send("Resource not found " + req.originalUrl);
      return;
    }
    res.redirect("/");
  });
}

async function serveOctoFarmNormally(app, quick_boot = false) {
  if (!quick_boot) {
    logger.info("Initialising FarmInformation...");
    await PrinterClean.initFarmInformation();

    await ClientSettings.init();

    const { Runner } = require("./server_src/runners/state.js");
    await Runner.init();

    OctoFarmTasks.BOOT_TASKS.forEach((task) =>
      TaskManager.registerJobOrTask(task)
    );

    await optionalInfluxDatabaseSetup();
  }

  serveOctoFarmRoutes(app);

  return app;
}

const logger = new Logger("OctoFarm-Server");

module.exports = {
  setupExpressServer,
  ensureSystemSettingsInitiated,
  serveOctoFarmRoutes,
  serveOctoFarmNormally
};
