const ClientSettingsDB = require("../models/ClientSettings.js");
const Constants = require("../constants/client-settings.constants");

class ClientSettingsService {
  async getOrCreate() {
    const settings = await ClientSettingsDB.find({});

    if (settings.length < 1) {
      const defaultClientSettings = new ClientSettingsDB(Constants.getDefaultSettings());
      await defaultClientSettings.save();
      return defaultClientSettings;
    }
    return settings[0];
  }
}

module.exports = ClientSettingsService;
