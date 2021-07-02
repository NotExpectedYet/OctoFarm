const { setupExpressServer, serveOctoFarmRoutes } = require("./app-core");
const { setupEnvConfig } = require("./app-env");
const {
  ensureSystemSettingsInitiated,
  ensureOctoFarmMiddleWareInitiated
} = require("./app-core");

/**
 * Setup the application without any async work
 * @returns {app}
 */
async function setupTestApp() {
  setupEnvConfig(true);
  await ensureSystemSettingsInitiated();

  const newServer = setupExpressServer();

  await ensureOctoFarmMiddleWareInitiated(newServer);

  serveOctoFarmRoutes(newServer);
  return newServer;
}

module.exports = {
  setupTestApp
};
