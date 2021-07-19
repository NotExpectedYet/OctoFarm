const { createWriteStream, createReadStream } = require("fs");
const { join } = require("path");
const archiver = require("archiver");
const Logger = require("../handlers/logger.js");

const logger = new Logger("OctoFarm-Server");

const { getLogsPath } = require("../utils/system-paths.utils.js");

const { checkIfFileFileExistsAndDeleteIfSo } = require("../utils/file.utils.js");

async function createZipFile(fileName, filePaths) {
  // create a file to stream archive data to.
  const currentZipFile = join(getLogsPath(), fileName);

  // Make sure existing zip files have been cleared from the system before continuing.
  await checkIfFileFileExistsAndDeleteIfSo(currentZipFile);

  const output = createWriteStream(currentZipFile);
  const archive = archiver("zip", {
    zlib: { level: 9 } // Sets the compression level.
  });

  // Listeners
  archive.on("warning", function (e) {
    logger.warning("Warning generated from zip function | ", e);
  });

  archive.on("error", function (e) {
    throw e;
  });

  // pipe archive data to the file
  archive.pipe(output);

  // Again just always used forEach on arrays, let me know!
  filePaths.forEach((logs) => {
    archive.append(createReadStream(logs?.path), { name: logs?.name });
  });

  // finalise the file as we've appended all of the files sent.
  await archive.finalize();

  return currentZipFile;
}

module.exports = { createZipFile };
