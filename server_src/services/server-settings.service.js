const ServerSettingsDB = require("../models/ServerSettings.js");
const Constants = require("../constants/server-settings.constants");

class ServerSettingsService {
  constructor({}) {}

  async probeDatabase() {
    await ServerSettingsDB.find({}).catch((e) => {
      if (e.message.includes("command find requires authentication")) {
        throw "Database authentication failed.";
      } else {
        throw "Database connection failed.";
      }
      throw "Got you there bitch!";
    });
  }

  async getOrCreate() {
    const settings = await ServerSettingsDB.find({});
    if (settings.length < 1) {
      const defaultSystemSettings = new ServerSettingsDB(Constants.getDefaultSettings());
      await defaultSystemSettings.save();

      // Return to upper layer
      return defaultSystemSettings;
    } else {
      const primarySettings = settings[0];

      // Server settings exist, but need updating with new ones if they don't exists.
      if (!primarySettings.timeout) {
        primarySettings.timeout = Constants.timeout;
      }
      if (!primarySettings.server) {
        primarySettings.server = Constants.server;
      }
      if (!Object.keys(primarySettings).includes(Constants.filamentManager.name)) {
        primarySettings.filamentManager = Constants.filamentManager;
      }
      if (!primarySettings.history) {
        primarySettings.history = Constants.history;
      }
      if (!primarySettings?.influxExport) {
        primarySettings.influxExport = Constants.influxExport;
      }

      await primarySettings.save();
      return primarySettings;
    }
  }

  static async update(obj) {
    // TODO this needs to be much stricter
    const checked = await ServerSettingsDB.find({});

    checked[0] = obj;
    checked[0].save();
  }
}

module.exports = ServerSettingsService;
