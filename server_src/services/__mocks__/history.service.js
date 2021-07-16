const historyService = jest.createMockFromModule("../history.service");
const realModule = jest.requireActual("../history.service");

let testHistory = [];

historyService.getFileFromHistoricJob = realModule.getFileFromHistoricJob;

/**
 * Test version of: history repository/service
 * @returns {Promise<*|null>}
 */
historyService.find = async () => {
  return testHistory;
};

historyService.saveMockData = (inputData) => {
  if (!Array.isArray(inputData)) {
    throw new Error(
      "Mate you cant even properly provide an array input to a MOCK TEST??? Dude, git gud."
    );
  }
  testHistory = inputData;
};

historyService.resetMockData = () => {
  testHistory = [];
};

module.exports = historyService;
