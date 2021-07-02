let { getServerSettingsCache } = jest.fn("../server-settings.cache.js");
jest.mock("../../services/database/server-settings.service.js");
let {
  ServerSettingsMock
} = require("../../services/database/server-settings.service.js");

let mockedServerSettingsCache;

getServerSettingsCache = async () => {
  if (!!mockedServerSettingsCache) {
    await initializeServerSettingsCache();
  }
  return mockedServerSettingsCache;
};

initializeServerSettingsCache = async () => {
  mockedServerSettingsCache = new ServerSettingsMock();
  return mockedServerSettingsCache.init();
};

module.exports = {
  getServerSettingsCache
};
