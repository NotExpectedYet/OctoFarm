const path = require("path");
const fs = require("fs");
const Logger = require("../handlers/logger.js");
const dotenv = require("dotenv");
const isDocker = require("is-docker");

const logger = new Logger("OF-Utils-Env", false);

function isPm2() {
  return (
    "PM2_HOME" in process.env || "PM2_JSON_PROCESSING" in process.env || "PM2_CLI" in process.env
  );
}

function isNodemon() {
  return (
    "npm_lifecycle_script" in process.env && process.env.npm_lifecycle_script.includes("nodemon")
  );
}

function isNode() {
  return "NODE" in process.env;
}

/**
 * Turn an object into an envfile string
 * Copied from https://github.com/bevry/envfile
 */
function stringifyDotEnv(obj) {
  let result = "";
  for (const [key, value] of Object.entries(obj)) {
    if (key) {
      const line = `${key}=${String(value)}`;
      result += line + "\n";
    }
  }
  return result;
}

/**
 * Write a new key-value to .env file
 * Note: assumes in Nodemon, pm2 or PKG mode.
 */
function writeVariableToEnvFile(absoluteEnvPath, variableKey, jsonObject) {
  if (isDocker()) {
    logger.error("Tried to persist setting to .env in docker mode. Avoided that.");
    return;
  }
  const latestDotEnvConfig = dotenv.config();
  if (latestDotEnvConfig?.error?.code === "ENOENT") {
    logger.warning("Creating .env file for you as it was not found.");
  } else if (!!latestDotEnvConfig.error) {
    logger.error(JSON.stringify(latestDotEnvConfig.error));
    throw new Error(
      "Could not parse current .env file. Please ensure the file contains lines with each looking like 'MONGO=http://mongo/octofarm' and 'OCTOFARM_PORT=4000' and so on."
    );
  }

  const newDotEnv = {
    ...latestDotEnvConfig.parsed,
    [variableKey]: jsonObject
  };

  const dotEnvResult = stringifyDotEnv(newDotEnv);
  fs.writeFileSync(absoluteEnvPath, dotEnvResult);
}

function verifyPackageJsonRequirements(rootPath) {
  const dirConts = fs.readdirSync(rootPath);
  const hasPackageJson = dirConts.includes("package.json");
  if (!hasPackageJson) {
    logger.error(`FAILURE. Could not find 'package.json' in root folder ${rootPath}`);
    return false;
  } else {
    logger.debug("✓ found 'package.json'");
    const packageName = require("../../package.json").name;
    if (!packageName) {
      logger.error("X Could not find 'name' property in package.json file. Aborting OctoFarm.");
      return false;
    } else if (packageName.toLowerCase() !== "octofarm") {
      logger.error(
        `X property 'name' in package.json file didnt equal 'octofarm' (found: ${packageName.toLowerCase()}). Aborting OctoFarm.`
      );
      return false;
    }
  }
  logger.debug("✓ Correctly validated octofarm package.json file!");
  return true;
}

function ensureBackgroundImageExists(rootPath) {
  // Explicit relative folder
  const targetBgDir = "./images";
  const targetBgPath = path.join(targetBgDir, "bg.jpg");
  if (!fs.existsSync(targetBgDir)) {
    fs.mkdirSync(targetBgDir);
  }
  const bgFileExists = fs.existsSync(targetBgPath);
  if (!bgFileExists) {
    const defaultBgPath = path.resolve(__dirname, "bg_default.jpg");
    if (!fs.existsSync(defaultBgPath)) {
      logger.error("cant find default bg file...", defaultBgPath);
    } else if (!fs.existsSync("images")) {
      logger.error("cant find target folder...", path.join(rootPath, "images"));
    } else {
      logger.info("everything good", defaultBgPath, targetBgPath);
    }

    // This is the reason why we dont copy under PKG
    // https://github.com/vercel/pkg/issues/420#issuecomment-397392619
    const fileBuffer = fs.readFileSync(path.resolve(__dirname, defaultBgPath));
    fs.writeFileSync(targetBgPath, fileBuffer);

    // Bug in PKG
    // fs.copyFileSync(defaultBgPath, "C:\\Users\\USER_HERE\\Projects\\NodeJS\\OctoFarm\\package\\images\\roll.jpg");

    logger.info(`✓ Copyied default background image to ${targetBgPath} as it was not found.`);
  }
}

module.exports = {
  isPm2,
  isNodemon,
  isNode,
  writeVariableToEnvFile,
  verifyPackageJsonRequirements,
  ensureBackgroundImageExists
};
