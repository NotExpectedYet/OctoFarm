const tempHistoryModel = jest.createMockFromModule("../TempHistory");

let tempHistory = [];

tempHistoryModel.find = () => {
  return {
    sort: () => {
      return {
        limit: () => {
          return tempHistory;
        }
      };
    }
  };
};
tempHistoryModel.create = async (log) => tempHistory.push(log);
tempHistoryModel.reset = async () => (tempHistory = []);

module.exports = tempHistoryModel;
