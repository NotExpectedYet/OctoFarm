const path = require("path");
const fs = require("fs");

function isPm2() {
  return (
    "PM2_HOME" in process.env ||
    "PM2_JSON_PROCESSING" in process.env ||
    "PM2_CLI" in process.env
  );
}

function isNodemon() {
  return (
    "npm_lifecycle_script" in process.env &&
    process.env.npm_lifecycle_script.includes("nodemon")
  );
}

function isNode() {
  return "NODE" in process.env;
}

function verifyPackageJsonRequirements(rootPath) {
  const dirConts = fs.readdirSync(rootPath);
  const hasPackageJson = dirConts.includes("package.json");
  if (!hasPackageJson) {
    console.error(
      `FAILURE. Could not find 'package.json' in root folder ${rootPath}`
    );
    return false;
  } else {
    console.info("✓ found 'package.json'");
    const packageName = require("../../package.json").name;
    if (!packageName) {
      console.error(
        "X Could not find 'name' property in package.json file. Aborting OctoFarm."
      );
      return false;
    } else if (packageName.toLowerCase() !== "octofarm") {
      console.error(
        `X property 'name' in package.json file didnt equal 'octofarm' (found: ${packageName.toLowerCase()}). Aborting OctoFarm.`
      );
      return false;
    }
  }
  console.info("✓ Correctly validated octofarm package.json file!");
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
      console.error("cant find default bg file...", defaultBgPath);
    } else if (!fs.existsSync("images")) {
      console.error("cant find target folder...", path.join(rootPath, "images"));
    } else {
      console.info("everything good", defaultBgPath, targetBgPath);
    }

    const fileBuffer = fs.readFileSync(path.resolve(__dirname, defaultBgPath));
    fs.writeFileSync(targetBgPath, fileBuffer);
    // fs.copyFileSync(defaultBgPath, "C:\\Users\\david\\Projects\\NodeJS\\OctoFarm\\package\\images\\roll.jpg");
    console.log(
      `✓ Copyied default background image to ${targetBgPath} as it was not found.`
    );
  }
}

module.exports = {
  isPm2,
  isNodemon,
  isNode,
  verifyPackageJsonRequirements,
  ensureBackgroundImageExists
};
