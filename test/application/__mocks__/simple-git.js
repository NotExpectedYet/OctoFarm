let simpleGitMock = jest.createMockFromModule("simple-git");

let currentScenario = null;
let isGitRepo = true;
let wasReset = null;
let wasPulled = false;
let wasForceReset = false;

simpleGitMock = () => {
  return {
    status: () => Promise.resolve(currentScenario),
    fetch: () => Promise.resolve(),
    pull: (force) => {
      wasForceReset = force;
      wasPulled = true;
      return Promise.resolve();
    },
    reset: (input) => {
      wasReset = true;
      return Promise.resolve();
    },

    // Mock helper functions below
    checkIsRepo: () => isGitRepo,
    testGetWasReset: () => wasReset,
    getWasForceReset: () => wasForceReset,
    getWasPulled: () => wasPulled,
    setTestScenario: (input) => {
      currentScenario = input;
    },
    setIsRepo: (isRepo) => (isGitRepo = isRepo)
  };
};

module.exports = simpleGitMock;
