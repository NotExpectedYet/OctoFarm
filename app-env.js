const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const isDocker = require("is-docker");
const envUtils = require("./server_src/utils/env.utils");
const dotenv = require("dotenv");
const Logger = require("./server_src/lib/logger.js");
const { AppConstants } = require("./server_src/app.constants");
const logger = new Logger("OF-Environment", false);

// Constants and definition
const instructionsReferralURL =
  "https://github.com/OctoFarm/OctoFarm/blob/master/README.md"; // TODO replace with environment setup markdown
const deprecatedConfigFolder = "./config";
const deprecatedConfigFilePath = deprecatedConfigFolder + "/db.js";
const packageJsonPath = "./package.json";
const dotEnvPath = "./.env";

/**
 * Ensures that `process.env.npm_package_version` is never undefined
 */
function ensureEnvNpmVersionSet() {
  if (!process.env.npm_package_version) {
    process.env.npm_package_version = require(packageJsonPath).version;
    process.env[AppConstants.NON_NPM_MODE_KEY] = "true";
    logger.info(
      `✓ Running OctoFarm version ${process.env.npm_package_version} in non-NPM mode!`
    );
  } else {
    logger.info(
      `✓ Running OctoFarm version ${process.env.npm_package_version} in NPM mode!`
    );
  }
}

function removePm2Service(reason) {
  logger.error(`Removing PM2 service as OctoFarm failed to start: ${reason}`);
  execSync("pm2 delete OctoFarm");
}

function removeFolderIfEmpty(folder) {
  return fs.rmdir(folder, function (err) {
    if (err) {
      logger.error(
        `~ Could not clear up the folder ${folder} as it was not empty`
      );
    } else {
      logger.info(`✓ Successfully removed the empty directory ${folder}`);
    }
  });
}

function setupPackageJsonVersionOrThrow() {
  const result = envUtils.verifyPackageJsonRequirements(__dirname);
  if (!result) {
    if (envUtils.isPm2()) {
      // TODO test this works under docker as well
      removePm2Service("didnt pass startup validation (package.json)");
    }
    throw new Error("Aborting OctoFarm server.");
  }
}

/**
 * Print out instructions URL
 */
function printInstructionsURL() {
  logger.info(
    `Please make sure to read ${instructionsReferralURL} on how to configure your environment correctly.`
  );
}

function removeDeprecatedMongoURIConfigFile() {
  logger.info("~ Removing deprecated config file 'config/db.js'.");
  fs.rmSync(deprecatedConfigFilePath);
  removeFolderIfEmpty(deprecatedConfigFolder);
}

function fetchMongoDBConnectionString(persistToEnv = false) {
  if (!process.env[AppConstants.MONGO_KEY]) {
    logger.warning(
      `~ ${AppConstants.MONGO_KEY} environment variable is not set. Assuming default: ${AppConstants.MONGO_KEY}=${AppConstants.defaultMongoStringUnauthenticated}`
    );
    printInstructionsURL();
    process.env[AppConstants.MONGO_KEY] = AppConstants.defaultMongoStringUnauthenticated;

    // is not isDocker just to be sure, also checked in writeVariableToEnvFile
    if (persistToEnv && !isDocker()) {
      envUtils.writeVariableToEnvFile(
        path.resolve(dotEnvPath),
        AppConstants.MONGO_KEY,
        AppConstants.defaultMongoStringUnauthenticated
      );
    }
  }
  return process.env[AppConstants.MONGO_KEY];
}

function fetchOctoFarmPort() {
  const port = process.env[AppConstants.OCTOFARM_PORT_KEY];
  if (Number.isNaN(parseInt(port))) {
    logger.warning(
      `~ The ${AppConstants.OCTOFARM_PORT_KEY} setting was not a correct port number: >= 0 and < 65536. Actual value: ${port}.`
    );

    // is not isDocker just to be sure, also checked in writeVariableToEnvFile
    if (!isDocker()) {
      envUtils.writeVariableToEnvFile(
        path.resolve(dotEnvPath),
        AppConstants.OCTOFARM_PORT_KEY,
        AppConstants.defaultOctoFarmPort
      );
      logger.info(
        `~ Written ${AppConstants.OCTOFARM_PORT_KEY}=${AppConstants.defaultOctoFarmPort} setting to .env file.`
      );
    }

    // Update config immediately
    process.env[
      AppConstants.OCTOFARM_PORT_KEY
    ] = AppConstants.defaultOctoFarmPort.toString();
  }
  return port;
}

/**
 * Make sure that we have a valid MongoDB connection string to work with.
 */
function ensureMongoDBConnectionStringSet() {
  let dbConnectionString = process.env[AppConstants.MONGO_KEY];
  if (!dbConnectionString) {
    if (isDocker()) {
      // This will not trigger often, as docker entrypoint catches this.
      fetchMongoDBConnectionString(false);
      return;
    }

    if (!fs.existsSync(deprecatedConfigFilePath)) {
      fetchMongoDBConnectionString(true);
      return;
    }

    const mongoFallbackURI = require(deprecatedConfigFilePath).MongoURI;
    if (!mongoFallbackURI) {
      logger.info(
        "~ Found deprecated config file 'config/db.js', but the MongoURI variable was not set (or possibly invalid)."
      );
      removeDeprecatedMongoURIConfigFile();
      logger.info(
        `~ ${AppConstants.MONGO_KEY} environment variable is not set. Assuming default: ${AppConstants.MONGO_KEY}=${AppConstants.defaultMongoStringUnauthenticated}`
      );
      printInstructionsURL();
      process.env[AppConstants.MONGO_KEY] = AppConstants.defaultMongoStringUnauthenticated;
    } else {
      // We're not in docker, so we have some patch-work to do.
      removeDeprecatedMongoURIConfigFile();
      logger.info(
        "~ Found deprecated config file 'config/db.js', performing small migration task to '.env'."
      );
      envUtils.writeVariableToEnvFile(
        path.resolve(dotEnvPath),
        AppConstants.MONGO_KEY,
        mongoFallbackURI
      );
      process.env[AppConstants.MONGO_KEY] = mongoFallbackURI;
    }
  } else {
    if (fs.existsSync(deprecatedConfigFilePath)) {
      logger.info(
        "~ Found deprecated config file 'config/db.js', but it is redundant. Clearing this up for you."
      );
      removeDeprecatedMongoURIConfigFile();
    }
    logger.info(`✓ ${AppConstants.MONGO_KEY} environment variable set!`);
  }
}

function ensurePortSet() {
  fetchOctoFarmPort();

  if (!process.env[AppConstants.OCTOFARM_PORT_KEY]) {
    logger.info(
      `~ ${AppConstants.OCTOFARM_PORT_KEY} environment variable is not set. Assuming default: ${AppConstants.OCTOFARM_PORT_KEY}=${AppConstants.defaultOctoFarmPort}.`
    );
    printInstructionsURL();
    process.env[
      AppConstants.OCTOFARM_PORT_KEY
    ] = AppConstants.defaultOctoFarmPort.toString();
  }
}

/**
 * Parse and consume the .env file. Validate everything before starting OctoFarm.
 * Later this will switch to parsing a `config.yaml` file.
 */
function setupEnvConfig(skipDotEnv = false) {
  if (!skipDotEnv) {
    // This needs to be CWD of app.js, so be careful not to move this call.
    dotenv.config({ path: path.join(__dirname, ".env") });
  }

  logger.info("✓ Parsed environment and (optional) .env file");
  setupPackageJsonVersionOrThrow();
  ensureEnvNpmVersionSet();
  ensureMongoDBConnectionStringSet();
  ensurePortSet();
  envUtils.ensureBackgroundImageExists(__dirname);
  ensurePageTitle();
}

function getViewsPath() {
  logger.debug("Running in directory:", __dirname);
  const viewsPath = path.join(__dirname, "./views");
  if (!fs.existsSync(viewsPath)) {
    if (isDocker()) {
      throw new Error(
        `Could not find views folder at ${viewsPath} within this docker container. Please report this as a bug to the developers.`
      );
    } else if (envUtils.isPm2()) {
      removePm2Service(
        `Could not find views folder at ${viewsPath} within the folder being run by Pm2. Please check your path or repository.`
      );
    } else if (envUtils.isNodemon()) {
      throw new Error(
        `Could not find views folder at ${viewsPath} within the folder being run by Nodemon. Please check your path or repository.`
      );
    } else {
      throw new Error(
        `Could not find views folder at ${viewsPath} within the OctoFarm path or binary PKG. Please report this as a bug to the developers.`
      );
    }
  } else {
    logger.info("✓ Views folder found:", viewsPath);
  }
  return viewsPath;
}

function ensurePageTitle() {
  if (!process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY]) {
    process.env[
        AppConstants.OCTOFARM_SITE_TITLE_KEY
        ] = AppConstants.defaultOctoFarmPageTitle?.toString();
  }
}

module.exports = {
  setupEnvConfig,
  fetchMongoDBConnectionString,
  fetchOctoFarmPort,
  getViewsPath,
};
