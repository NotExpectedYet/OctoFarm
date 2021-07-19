const farmStatisticsService = jest.createMockFromModule("../farm-statistics.service");
const realModule = jest.requireActual("../farm-statistics.service");

let testFarmStatistics = [];

/**
 * Mock saved farm statistics in the database.
 */
farmStatisticsService.list = async () => {
  return testFarmStatistics;
};

farmStatisticsService.create = async (startDate, heatmapArray) => {
  const newEntry = {
    farmStart: startDate,
    heatMap: heatmapArray,
    markModified: () => {},
    save: async () => {}
  };
  testFarmStatistics.push(newEntry);
  return Promise.resolve(newEntry);
};

farmStatisticsService.saveMockData = (inputData) => {
  if (!Array.isArray(inputData)) {
    throw new Error(
      "Mate you cant even properly provide an array input to a MOCK TEST??? Dude, git gud."
    );
  }
  testFarmStatistics = inputData;
};

farmStatisticsService.resetMockData = () => {
  testFarmStatistics = [];
};

module.exports = farmStatisticsService;
