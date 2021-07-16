const { existsSync, unlinkSync } = require("fs");

async function checkIfFileFileExistsAndDeleteIfSo(fileName) {
  let fileExists = false;
  if (existsSync(fileName)) await deleteExistingZipFile(fileName);
  return fileExists;
}

function deleteExistingZipFile(fileName) {
  return unlinkSync(fileName);
}

module.exports = {
  checkIfFileFileExistsAndDeleteIfSo
};
