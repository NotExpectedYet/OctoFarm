const { readdirSync, statSync } = require("fs");
const { join } = require("path");

const { createZipFile } = require("../utils/zip.utils.js");
const { getLogsPath } = require("../utils/system-paths.utils.js");
const {
  generateOctoFarmSystemInformationTxt
} = require("../services/system-information.service.js");

// Grab Logs
class Logs {
  static async grabLogs() {
    const fileArray = [];
    const testFolder = getLogsPath();
    const folderContents = await readdirSync(testFolder);
    for (let i = 0; i < folderContents.length; i++) {
      const logFilePath = join(testFolder, folderContents[i]);
      const stats = await statSync(logFilePath);
      const logFile = {
        name: folderContents[i],
        path: logFilePath,
        size: stats?.size,
        modified: stats?.mtime,
        created: stats?.birthtime
      };
      fileArray.push(logFile);
    }
    return fileArray;
  }
  static async generateOctoFarmLogDump() {
    const fileList = [];

    // Generate nice text file of system information
    let octofarmInformationTxt = await generateOctoFarmSystemInformationTxt();
    if (!octofarmInformationTxt)
      throw "Couldn't generate octofarms_information.txt file...";

    fileList.push(octofarmInformationTxt);

    // Collect all latest log files
    let currentLogFiles = await this.grabLogs();

    // Let me know if there's a better way here. Just always used forEach.
    currentLogFiles.forEach((logPath) => {
      if (logPath?.name.includes(".log")) {
        const logFile = {
          name: logPath?.name,
          path: logPath?.path
        };
        fileList.push(logFile);
      }
    });
    // Create the zip file and return the path.
    return createZipFile("octofarm_dump.zip", fileList);
  }
}

module.exports = { Logs };
