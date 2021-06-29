const { readdirSync, existsSync } = require("fs");
const path = require("path");
const Logger = require("../lib/logger.js");
const {
  getPluginState,
  setScannedPlugins,
  setConfiguredPlugins,
  setLoadedPlugins,
  getPluginPaths
} = require("./plugin-state");
const { pluginEntryMethods } = require("./plugin-constants");
const { Validator } = require("node-input-validator");

const logger = new Logger("OctoFarm-PluginManager");
const pluginPathNotProvidedError = (pluginName) =>
  `Plugin path 'pathName' argument was not provided. Plugin '${pluginName}' will be skipped`;
const basePathsArgumentIsNotValidArrayError =
  "The plugin folders array argument 'basePaths' was not an array or was empty";
const succesfullyFoundPluginsMessage = (numPlugins, numFolders) =>
  `Succesfully registered ${numPlugins} plugins in ${numFolders} folders`;
const noPluginsMessage = (numFolders) =>
  `No plugins registered in ${numFolders} folders`;
const maxInvalidPluginsForReportLog = 4;
const numInvalidPluginsError = (numPlugins) =>
  `Failure to register ${numPlugins} possible plugin folders.`;

function getDirectories(source) {
  return readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => {
      return dirent.name;
    });
}

function checkPluginFolderConstraints(dir) {
  const pluginJson = `${dir}/plugin.json`;
  const entry = `${dir}/entry.js`;
  const pluginJsonExists = existsSync(pluginJson);
  const entryExists = existsSync(entry);
  return {
    pluginJsonExists,
    pluginJsonPath: pluginJson,
    entryExists,
    entryPath: entry,
    valid: pluginJsonExists && entryExists
  };
}

function findEligiblePluginFolders(basePaths) {
  if (!Array.isArray(basePaths) || !basePaths) {
    throw new Error(basePathsArgumentIsNotValidArrayError);
  }

  const pluginsFound = [];
  const foldersIgnored = [];
  for (let basePath of basePaths) {
    const subfolders = getDirectories(basePath);
    for (let dir of subfolders) {
      const pluginPath = path.join(path.resolve(basePath), dir);
      const report = checkPluginFolderConstraints(pluginPath);
      if (report.valid) {
        pluginsFound.push({
          basePath,
          path: pluginPath,
          name: dir,
          report,
          entry: require(report.entryPath),
          json: require(report.pluginJsonPath)
        });
      } else {
        foldersIgnored.push({
          basePath,
          path: dir,
          report
        });
      }
    }
  }

  if (foldersIgnored.length === 0) {
    if (pluginsFound.length > 0) {
      logger.info(
        succesfullyFoundPluginsMessage(pluginsFound.length, basePaths.length)
      );
    } else {
      logger.info(noPluginsMessage(basePaths.length));
    }
  } else {
    logger.warning(numInvalidPluginsError(foldersIgnored.length));

    // Prevent excessive logging
    if (foldersIgnored.length <= maxInvalidPluginsForReportLog) {
      for (let failedFolder of foldersIgnored) {
        logger.warning(
          `Folder: ${failedFolder.path}\n\tBasePath: ${
            failedFolder.basePath
          }\n\tReport: ${JSON.stringify(failedFolder.report)}`
        );
      }
    }
  }

  return pluginsFound;
}

const pluginJsonValidation = {
  name: "required|string",
  description: "sometimes|string",
  author: "required|string",
  repository: "required|string",
  dependencies: "required|object",
  devDependencies: "sometimes|object",
  version: "required|string",
  minVersion: "required|string"
};

async function validatePluginJson(jsonModule) {
  const v = new Validator(jsonModule, pluginJsonValidation);
  await v.check();
  return v.getErrors();
}

function validatePluginEntry(module) {
  let report;
  const errors = [];
  const hooks = [];

  for (let methodEntry of pluginEntryMethods) {
    const moduleMethod = module[methodEntry.method];

    if (!moduleMethod && methodEntry.required) {
      errors.push({
        methodName: methodEntry.method,
        exists: false,
        required: methodEntry.required,
        method: false
      });
    } else if (!!moduleMethod && typeof moduleMethod !== "function") {
      errors.push({
        methodName: methodEntry.method,
        exists: true,
        required: methodEntry.required,
        method: false
      });
    } else if (!!moduleMethod) {
      hooks.push({
        methodName: methodEntry.method,
        exists: true,
        required: methodEntry.required,
        method: true
      });
    }
  }

  report = {
    errors,
    hooks
  };
  return report;
}

/**
 * Validate plugin existence or load them automatically
 */
async function scanPlugins() {
  // TODO merge plugin paths with AppData/userland-folder or UI/CLI config
  const eligiblePlugins = findEligiblePluginFolders(getPluginPaths());
  const validTemplatePlugins = [];

  let pluginErrors = [];
  for (let plugin of eligiblePlugins) {
    const errorsJson = await validatePluginJson(plugin.json);
    const errorsEntry = validatePluginEntry(plugin.entry);

    if (errorsJson.length > 0 || errorsEntry.errors.length > 0) {
      pluginErrors.push({
        name: plugin.name,
        plugin,
        json: errorsJson,
        entry: errorsEntry.errors
      });
    } else {
      validTemplatePlugins.push(plugin);
    }
  }

  setScannedPlugins(validTemplatePlugins, pluginErrors);

  return {
    plugins: validTemplatePlugins,
    errors: pluginErrors
  };
}

async function configurePluggy(pluggy, app, host) {
  return await pluggy.entry.onAppConfigure(app, host).catch();
}

/**
 * Required hook to make sure the plugin is validated, appended to API, cache, database and MVC without any crashes/errors.
 */
async function configurePlugins(octoFarmExpressServer, host) {
  const badPluggies = [];
  const goodPluggies = [];
  for (let pluggy of getPluginState().scannedPlugins) {
    await configurePluggy(pluggy, octoFarmExpressServer, host)
      .then(() => goodPluggies.push(pluggy))
      .catch((e) => {
        logger.warning(
          `Plugin ${pluggy.name} failed to configure. Stack: ${e.stack}`
        );
        badPluggies.push({
          plugin: pluggy,
          error: `Plugin ${pluggy.name} failed to configure. Stack: ${e.stack}`,
          inner_exception: e
        });
      });
  }

  // Impact on state
  setConfiguredPlugins(goodPluggies, badPluggies);
  logger.info(
    `Configured ${goodPluggies.length} plugins and ${badPluggies.length} failed plugins.`
  );
}

/**
 * Practical hook to make sure the API is running and ready for action
 */
async function postInitOctoFarmAndPlugins() {
  const badPluggies = [];
  const goodPluggies = [];
  for (let pluggy of getPluginState().configuredPlugins) {
    await pluggy.entry
      .onAppInitialization()
      .then(() => goodPluggies.push(pluggy))
      .catch((e) => {
        logger.warning(
          `Plugin ${pluggy.name} failed to pre initialize. Stack: ${e.stack}`
        );
        badPluggies.push(pluggy);
      });
  }

  // Now call the last hook after all plugins had their startup called
  for (let pluggy of goodPluggies) {
    if (
      !!pluggy.entry?.postAppInitialization &&
      typeof pluggy.entry.postAppInitialization === "function"
    ) {
      await pluggy.entry.postAppInitialization().catch((e) => {
        logger.warning(
          `Plugin ${pluggy.name} failed to post initialize. Stack: ${e.stack}`
        );
        badPluggies.push(pluggy);
      });
    }
  }
  // No impact on state
}

module.exports = {
  pluginPathNotProvidedError,
  basePathsArgumentIsNotValidArrayError,
  checkPluginFolderConstraints,
  findEligiblePluginFolders,
  scanPlugins,
  configurePluggy,
  configurePlugins,
  postInitOctoFarmAndPlugins
};
