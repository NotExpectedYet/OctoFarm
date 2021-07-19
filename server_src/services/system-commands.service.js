const { exec } = require("child_process");
const { isPm2 } = require("../utils/env.utils.js");
const { isNodemon } = require("../utils/env.utils.js");
const { lookpath } = require("lookpath");

const { returnListOfMissingPackages, installNpmDependency } = require("../utils/npm.utils.js");
const {
  returnCurrentGitStatus,
  isBranchUpToDate,
  isBranchInfront,
  getListOfModifiedFiles,
  pullLatestRepository,
  checkIfWereInAGitRepo,
  makeSureBranchIsUpToDateWithRemote
} = require("../utils/git.utils.js");

class SystemCommandsService {
  constructor() {}

  async restartOctoFarm() {
    let checkForNamedService = false;

    // If we're on pm2, then restart buddy!
    if (isPm2()) {
      try {
        let doesFunctionExist = await lookpath("pm2");

        if (doesFunctionExist) {
          setTimeout(async () => {
            await exec("pm2 restart OctoFarm");
          }, 5000);

          checkForNamedService = true;
        }
      } catch (e) {
        throw "Error with pm2 restart command: " + e;
      }
    }

    if (isNodemon()) {
      try {
        let doesFunctionExist = await lookpath("touch");

        if (doesFunctionExist) {
          setTimeout(async () => {
            await exec("touch ./app.js");
          }, 5000);

          checkForNamedService = true;
        }
      } catch (e) {
        throw "Error with nodemon restart command: " + e;
      }
    }

    return checkForNamedService;
  }

  // This will need changing when .deb / installation script becomes a thing. It's built to deal with the current implementation.
  async checkIfOctoFarmNeedsUpdatingAndUpdate(clientResponse, force) {
    // Check to see if current dir contains a git folder... hard fail otherwise.
    let isThisAGitRepo = await checkIfWereInAGitRepo();
    if (!isThisAGitRepo) {
      clientResponse.statusTypeForUser = "warning";
      clientResponse.message =
        "Not a git repository, user intervention required! You will have to re-download OctoFarm and re-unpack it over this directory. Make sure to backup your images folder!";
      return clientResponse;
    }

    // We can safely skip these checks if either of these are true as they should have been run by the time these get flagged.
    if (!force.doWeInstallPackages && !force.forcePull) {
      // Make sure branch is up to date with remote.
      await makeSureBranchIsUpToDateWithRemote();

      const gitCurrentStatus = await returnCurrentGitStatus();
      // Check if branch is already up to date. Nothing to do, return response to user.
      const gitBranchUpToDate = isBranchUpToDate(gitCurrentStatus);
      if (gitBranchUpToDate) {
        clientResponse.haveWeSuccessfullyUpdatedOctoFarm = false;
        clientResponse.message = "OctoFarm is already up to date! Your good to go!";
        clientResponse.statusTypeForUser = "success";
        return clientResponse;
      }

      //The below checks should only run if the branch is not up to date... pointless otherwise

      // Check if modified files exist and alert the user
      const modifiedFilesList = getListOfModifiedFiles(gitCurrentStatus);
      if (modifiedFilesList.length > 0) {
        const gitBranchInFront = isBranchInfront(gitCurrentStatus);
        clientResponse.statusTypeForUser = "warning";
        if (gitBranchInFront) {
          //If the branch is not front of current branch, then we need to relay the developer message.
          clientResponse.message =
            "<span class='text-warning'>The update is failing due to local changes been detected. Seems you've committed your files, Thanks for making OctoFarm great! <br><br>" +
            "<b class='text-success'>Override:</b> Will just run a <code>git pull</code> command if you continue.<br><br>" +
            "<b class='text-danger'>Cancel:</b> This option will cancel the update process.<br><br>";
          return clientResponse;
        } else {
          // If the branch has no commits then we can relay the user message.
          clientResponse.message =
            "<span class='text-warning'>The update is failing due to local changes been detected. Please check the file list below for what has been modified. </span><br><br>" +
            "<b class='text-success'>Override:</b> This option will ignore the local changes and run the OctoFarm Update process. (You will lose your changes with this option)<br><br>" +
            "<b class='text-danger'>Cancel:</b> This option will cancel the update process keeping your local changes. No update will run and manual intervention by the user is required. <br><br>";
          modifiedFilesList.forEach((line) => {
            clientResponse.message += `<div class="alert alert-secondary m-1 p-2" role="alert"><i class="fas fa-file"></i> ${line.replace(
              "modified: ",
              ""
            )} </div>`;
          });
          return clientResponse;
        }
      }
    }

    // Branch is not up to date and we do not have any modified files... we can continue
    await pullLatestRepository(force.forcePull);

    // Check to see if npm packages are missing and if so install them...
    const missingPackagesList = await returnListOfMissingPackages();
    // If we have missing packages alert the user and wait for their response, if response given then install missing deps.
    if (missingPackagesList.length > 0) {
      if (!force?.doWeInstallPackages) {
        clientResponse.statusTypeForUser = "warning";
        clientResponse.message =
          "<span class='text-warning'>You have missing dependencies that are required, Do you want to update these? </span><br><br>" +
          "<b class='text-success'>Confirm:</b> This option will install the missing local dependencies and continue the upgrade process<br><br>" +
          "<b class='text-danger'>Cancel:</b> This option will cancel the update process and not install the required dependencies. No update will run and manual intervention by the user is required. <br><br>";
        return clientResponse;
      } else {
        for (let i = 0; i > missingPackagesList.length; i++) {
          await installNpmDependency(missingPackagesList[i]);
        }
      }
    }

    // Everything went well, enjoy the tasty updates!
    clientResponse.haveWeSuccessfullyUpdatedOctoFarm = true;
    clientResponse.statusTypeForUser = "success";
    clientResponse.message = "Update command has run successfully, OctoFarm will restart.";
    // Local changes
    return clientResponse;
  }
}

module.exports = SystemCommandsService;
