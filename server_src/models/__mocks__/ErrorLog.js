const errorLogsModel = jest.createMockFromModule("../ErrorLog");

let logs = [];

errorLogsModel.find = async () => logs;
errorLogsModel.create = async (log) => logs.push(log);
errorLogsModel.reset = async () => (logs = []);

module.exports = errorLogsModel;
