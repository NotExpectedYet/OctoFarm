const { getDefaultPluginsState } = require("./plugin-constants");

// Settings
let additionalPluginPaths = [];

function getPluginPaths() {
  return [__dirname, ...additionalPluginPaths];
}

function resetAdditionalPluginPaths() {
  additionalPluginPaths = [];
}

function setAdditionalPluginPaths(paths) {
  if (!Array.isArray(paths)) {
    throw "'setAdditionalPluginPaths' didnt receive an Array of paths. Skipping";
  }

  additionalPluginPaths.push(...paths);
}

// {
//   scannedPlugins: [],
//   failedValidationPlugins: [],
//   loadedPlugins: [],
//   failedToLoadPlugins: [],
//   bootedPlugins: []
// };
let pluginsState = getDefaultPluginsState();

function getPluginState() {
  return pluginsState;
}

function setScannedPlugins(scannedPlugins, failedValidationPlugins) {
  if (!Array.isArray(scannedPlugins)) {
    throw "'scannedPlugins' argument is not an array.";
  }
  if (!Array.isArray(failedValidationPlugins)) {
    throw "'failedValidationPlugins' argument is not an array.";
  }

  pluginsState.scannedPlugins = scannedPlugins;
  pluginsState.failedValidationPlugins = failedValidationPlugins;
}

function setConfiguredPlugins(loadedPlugins, failedToLoadPlugins) {
  if (!Array.isArray(loadedPlugins)) {
    throw "'loadedPlugins' argument is not an array.";
  }
  if (!Array.isArray(failedToLoadPlugins)) {
    throw "'failedToLoadPlugins' argument is not an array.";
  }

  pluginsState.configuredPlugins = loadedPlugins;
  pluginsState.failedToConfigurePlugins = failedToLoadPlugins;
}

function setBootedPlugins(bootedPlugins) {
  if (!Array.isArray(bootedPlugins)) {
    throw "'bootedPlugins' argument is not an array.";
  }

  pluginsState.bootedPlugins = bootedPlugins;
}

function resetPluginState() {
  pluginsState = getDefaultPluginsState();
}

module.exports = {
  getPluginPaths,
  setAdditionalPluginPaths,
  resetAdditionalPluginPaths,
  getPluginState,
  resetPluginState,
  setScannedPlugins,
  setConfiguredPlugins,
  setBootedPlugins
};
