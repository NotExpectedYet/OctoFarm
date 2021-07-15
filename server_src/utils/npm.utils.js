const util = require("util");
const exec = util.promisify(require("child_process").exec);

async function returnListOfMissingPackages() {
  try {
    const outdatedPackageJsonList = await exec("npm outdated --production --json");
    const outdatedPackageListParsed = JSON.parse(outdatedPackageJsonList.stdout);
    if (outdatedPackageListParsed) {
      const keys = Object.keys(outdatedPackageListParsed);
      const missingPackageList = [];

      keys.forEach((key, index) => {
        if (!outdatedPackageListParsed[key].current) {
          missingPackageList.push(key);
        }
      });
      return missingPackageList;
    }
  } catch (e) {
    throw `Error running npm outdated command | ${e}`;
  }
}

async function installNpmDependency(dependency) {
  try {
    await exec(`npm install ${dependency}`);
  } catch (e) {
    throw `Error running installation command | ${e}`;
  }
}

module.exports = {
  returnListOfMissingPackages,
  installNpmDependency
};
