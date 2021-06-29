let majorVersion = null;
try {
  majorVersion = parseInt(process.version.replace("v", "").split(".")[0]);
} catch (e) {
  // We dont abort on parsing failures
}

if (!!majorVersion && majorVersion < 14) {
  // Dont require this in the normal flow (or NODE_ENV can not be fixed before start)
  const {
    serveNodeVersionFallback,
    setupFallbackExpressServer
  } = require("./app-fallbacks");

  const octoFarmServer = setupFallbackExpressServer();
  serveNodeVersionFallback(octoFarmServer);
} else {
  const {
    setupEnvConfig,
    fetchMongoDBConnectionString,
    fetchOctoFarmPort
  } = require("./app-env");

  function bootAutoDiscovery() {
    require("./server_src/runners/autoDiscovery.js");
  }

  // Set environment/.env file and NODE_ENV if not set. Will call startup checks.
  setupEnvConfig();

  const {
    setupExpressServer,
    serveOctoFarmNormally,
    ensureSystemSettingsInitiated,
    initPluginManager
  } = require("./app-core");
  const { configurePlugins } = require("./server_src/plugins/plugin-manager");
  const mongoose = require("mongoose");
  const Logger = require("./server_src/lib/logger.js");
  
  const logger = new Logger("OctoFarm-Server");

  const octoFarmServer = setupExpressServer();
  
  mongoose
    .connect(fetchMongoDBConnectionString(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
      serverSelectionTimeoutMS: 2500
    })
    .then(() => ensureSystemSettingsInitiated())
    .then(async () => {
      const port = fetchOctoFarmPort();
      if (!port || Number.isNaN(parseInt(port))) {
        throw new Error(
          "The server database-issue mode requires a numeric port input argument"
        );
      }

      await initPluginManager();

      const app = await serveOctoFarmNormally(octoFarmServer);

      const serverUrl = `http://0.0.0.0:${port}`;

      await configurePlugins(octoFarmServer, serverUrl);

      // Allowed by process.env.NODE_ENV === development
      // const { listAPI } = require("./server_src/utils/api.util");
      // listAPI(app);

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
      app.listen(port, "0.0.0.0", () => {
        logger.info(`Server started... open it at http://127.0.0.1:${port}`);
      });
    })
    .catch(async (err) => {
      logger.error(err);
      const { serveDatabaseIssueFallback } = require("./app-fallbacks");
      serveDatabaseIssueFallback(octoFarmServer, fetchOctoFarmPort());
    });

  bootAutoDiscovery();
}
