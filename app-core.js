const express = require("express");
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const ServerSettingsDB = require("./server_src/models/ServerSettings");
const envUtils = require("./server_src/utils/env.utils");
const expressLayouts = require("express-ejs-layouts");
const Logger = require("./server_src/lib/logger.js");
const { ServerSettings } = require("./server_src/settings/serverSettings.js");
const { SystemRunner } = require("./server_src/runners/systemInfo.js");
const { ClientSettings } = require("./server_src/settings/clientSettings.js");
const {
  PrinterClean,
} = require("./server_src/lib/dataFunctions/printerClean.js");
const {
  optionalInfluxDatabaseSetup,
} = require("./server_src/lib/influxExport.js");
const { getViewsPath } = require("./app-env");

function setupExpressServer() {
  let app = express();

  require("./server_src/config/passport.js")(passport);
  app.use(express.json());
  const viewsPath = getViewsPath();
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
      saveUninitialized: true,
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
  const serverSettings = await ServerSettings.init();
  await logger.info(serverSettings);
}

function serveDatabaseIssueFallback(app, port) {
  if (!port || Number.isNaN(parseInt(port))) {
    throw new Error("The server database-issue mode requires a numeric port input argument");
  }
  let listenerHttpServer = app.listen(
    port,
    "0.0.0.0",
    () => {
      const msg = `You have database connection issues... open our webpage at http://127.0.0.1:${port}`;
      logger.info(msg);

      if (envUtils.isPm2()) {
        process.send("ready");
      }
    }
  );

  app.use("/", require("./server_src/routes/databaseIssue", { page: "route" }));
  app.use(
    "/serverChecks",
    require("./server_src/routes/serverChecks", { page: "route" })
  );
  app.get("*", function (req, res) {
    res.redirect("/");
  });

  return listenerHttpServer;
}

async function serveOctoFarmNormally(app, port) {
  if (!port || Number.isNaN(parseInt(port))) {
    throw new Error("The server database-issue mode requires a numeric port input argument");
  }

  let listenerHttpServer = null;

  logger.info("Initialising FarmInformation...");
  await PrinterClean.initFarmInformation();

  logger.info("Initialising Client Settings...");
  await ClientSettings.init();

  logger.info("Initialising OctoFarm State...");
  const { Runner } = require("./server_src/runners/state.js");
  const stateRunnerReport = await Runner.init();
  logger.info("OctoFarm State returned", stateRunnerReport);

  logger.info("Initialising SystemRunner...");
  const sr = await SystemRunner.init();
  logger.info("OctoFarm SystemRunner returned", sr);

  await optionalInfluxDatabaseSetup();

  listenerHttpServer = app.listen(
    port,
    "0.0.0.0",
    () => {
      logger.info(
        `Server started... open it at http://127.0.0.1:${port}`
      );
      if (typeof process.send === "function") {
        process.send("ready");
      }
    }
  );

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
  app.use("/client", require("./server_src/routes/sorting", { page: "route" }));
  app.get("*", function (req, res) {
    res.redirect("/");
  });

  return listenerHttpServer;
}

const logger = new Logger("OctoFarm-Server");

module.exports = {
  setupExpressServer,
  ensureSystemSettingsInitiated,
  serveOctoFarmNormally,
  serveDatabaseIssueFallback,
};
