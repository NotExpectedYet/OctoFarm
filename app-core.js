const express = require("express");
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const expressLayouts = require("express-ejs-layouts");
const Logger = require("./server_src/handlers/logger.js");
const container = require("./server_src/container");
const { scopePerRequest, loadControllers } = require("awilix-express");
const { OctoFarmTasks } = require("./server_src/tasks");
const { getViewsPath } = require("./app-env");

function setupExpressServer() {
  let app = express();

  const userTokenService = container.resolve("userTokenService");
  require("./server_src/middleware/passport.js")(passport, userTokenService);

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

  app.use(scopePerRequest(container));

  return app;
}

async function ensureSystemSettingsInitiated() {
  logger.info("Loading Server Settings.");

  const serverSettingsService = container.resolve("serverSettingsService");
  await serverSettingsService.probeDatabase();

  const settingsStore = container.resolve("settingsStore");
  return await settingsStore.loadSettings();
}

function serveOctoFarmRoutes(app) {
  const routePath = "./server_src/routes";
  app.use("/filament", require(`${routePath}/filament`, { page: "route" }));
  app.use("/history", require(`${routePath}/history`, { page: "route" }));

  app.use(loadControllers("server_src/routes/settings/*.controller.js", { cwd: __dirname }));
  app.use(loadControllers("server_src/routes/*.controller.js", { cwd: __dirname }));

  app.get("*", function (req, res) {
    const path = req.originalUrl;
    if (path.startsWith("/api") || path.startsWith("/plugins")) {
      logger.error("API resource was not found " + path);
      res.status(404);
      res.send({ error: "API endpoint or method not found" });
      return;
    } else if (req.originalUrl.endsWith(".min.js")) {
      logger.error("Javascript resource was not found " + path);
      res.status(404);
      res.send("Resource not found " + path);
      return;
    }

    logger.error("MVC resource was not found " + path);
    res.redirect("/");
  });
}

async function serveOctoFarmNormally(app, quick_boot = false) {
  if (!quick_boot) {
    logger.info("Initialising FarmInformation...");
    const printerClean = container.resolve("printerClean");
    await printerClean.initFarmInformation();

    const octofarmManager = container.resolve("octofarmManager");
    await octofarmManager.init();

    const printersStore = container.resolve("printersStore");
    await printersStore.loadPrintersStore();

    const taskManagerService = container.resolve("taskManagerService");
    if (process.env.SAFEMODE_ENABLED !== "true") {
      OctoFarmTasks.BOOT_TASKS.forEach((task) => taskManagerService.registerJobOrTask(task));
    } else {
      logger.warning("Starting in safe mode due to SAFEMODE_ENABLED");
    }

    const influxSetupService = container.resolve("influxSetupService");
    await influxSetupService.optionalInfluxDatabaseSetup();
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
