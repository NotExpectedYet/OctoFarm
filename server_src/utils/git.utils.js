const simpleGit = require("simple-git");
const git = simpleGit();

function makeSureBranchIsUpToDateWithRemote() {
  return git.fetch();
}

function checkIfWereInAGitRepo() {
  return git.checkIsRepo();
}

function returnCurrentGitStatus() {
  return git.status();
}

function isBranchUpToDate(status) {
  return status.behind === 0;
}

function isBranchInfront(status) {
  return status.ahead !== 0;
}

function getListOfModifiedFiles(status) {
  return status.modified;
}

async function pullLatestRepository(force) {
  if (force) {
    await git.reset("hard");
    return git.pull();
  } else {
    return git.pull();
  }
}

module.exports = {
  returnCurrentGitStatus,
  isBranchUpToDate,
  isBranchInfront,
  getListOfModifiedFiles,
  pullLatestRepository,
  checkIfWereInAGitRepo,
  makeSureBranchIsUpToDateWithRemote
};
