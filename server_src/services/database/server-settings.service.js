const ServerSettingsDB = require("../../models/ServerSettings.js");

const { isEmpty } = require("lodash");

class ServerSettingsService {
  currentServerSettings;

  /**
   * Returns the entire settings object from catch
   * @returns {Object} Object from cache for all of OctoFarms settings
   */
  get entireServerSettingsObject() {
    return this.currentServerSettings;
  }

  /**
   * Returns the polling settings for OctoPrints websocket connection
   * @returns {Object} Object from cache for OctoPrints websocket connection
   */
  get octoPrintWebsocketPollingSettings() {
    return this.currentServerSettings.onlinePolling;
  }

  /**
   * Returns the server specific settings object for OctoFarm
   * @returns {Object} Object from cache for OctoFarms server settings
   */
  get systemSettings() {
    return this.currentServerSettings.server;
  }

  /**
   * Returns the OctoPrint connection timeout settings object for API/Websockets
   * @returns {Object} Object from cache for the OctoPrint specific timeout settings
   */

  get octoPrintTimeoutSettings() {
    return this.currentServerSettings.timeout;
  }

  /**
   * Returns the filament manager settings object
   * @returns {Object} Object from cache for the filament manager settings
   */
  get filamentManagerSettings() {
    return this.currentServerSettings.filament;
  }

  /**
   * Returns the history collection settings object
   * @returns {Object} Object from cache for the history collection settings
   */
  get historyCollectionSettings() {
    return this.currentServerSettings.history;
  }

  /**
   * Returns the influx database settings object
   * @returns {Object} Object from cache for the influx database settings
   */
  get influxDatabaseSettings() {
    return this.currentServerSettings.influxExport;
  }

  /**
   * Returns the filament manager enabled boolean
   * @returns {Boolean} Truthy value of whether filament manager is enabled
   */
  get octoPrintFilamentManagerPluginSettings() {
    return this.currentServerSettings.filamentManager;
  }

  /**
   * Initialises server settings on boot, reboot and makes sure all required values are defined. Creates cache of current values.
   * @returns {String} String stating success or failure
   */
  async init() {
    let currentSettings;
    try {
      currentSettings = await this.listServerSettingsDocs();
      if (currentSettings.length < 1) {
        let defaultServerSettings = new ServerSettingsDB({});
        await defaultServerSettings.save();
        this.currentServerSettings = defaultServerSettings;
        return "Default server settings have been created";
      } else {
        // Re-save settings to make sure defaults are available...
        await currentSettings[0].save();
        this.currentServerSettings = currentSettings[0];
        return "Server settings already exist, loaded existing values...";
      }
    } catch (e) {
      if (e.message.includes("command find requires authentication")) {
        throw "Database authentication failed.";
      } else {
        throw "Database connection failed.";
      }
    }
  }

  /**
   * Resets server settings to default and updates the internal cache
   */
  async resetServerSettingsToDefault() {
    const currentDatabaseSettings = await this.listServerSettingsDocs({});
    console.log(currentDatabaseSettings);
    await currentDatabaseSettings.deleteMany({});
    await currentDatabaseSettings.save();
    this.currentServerSettings = currentDatabaseSettings;
  }

  /**
   * Checks the database for the server settings, can be supplied with filter and options to specify mongoose options/filter.
   * @param {Object} filter object to filter the database results
   * @param {Object} options object to change the database options
   * @returns {Object} Object containing the filtered settings / full settings
   */
  listServerSettingsDocs({ filter = {}, options = {} } = {}) {
    return ServerSettingsDB.find(filter, {}, options);
  }

  /**
   * Updates the polling settings for OctoPrints websocket connection in the database and then the cache.
   * @param {Object} value containing the seconds key for OctoPrints websocket polling. String value of polling time.
   * @throws {Error} value not provided or empty.
   * @returns {Object} containing the new settings value
   */
  async updateOctoPrintWebsocketPollSettings(value = {}) {
    if (isEmpty(value)) throw new Error("No value provided to update settings");

    //Filter out the current settings from cache
    const settingsDatabaseID = this.currentServerSettings._id;

    // Find the filter and update the server settings with the new value...
    const updatedSettings = await ServerSettingsDB.findOneAndUpdate(
      { _id: settingsDatabaseID },
      { onlinePolling: value },
      {
        new: true
      }
    );
    // Make sure to replicate the changes in cache.
    this.currentServerSettings.onlinePolling = value;

    return updatedSettings.onlinePolling;
  }

  /**
   * Updates the polling settings for OctoPrints websocket connection in the database and then the cache.
   * @param {Object} value containing the seconds key for OctoPrints websocket polling. String value of polling time.
   * @throws {Error} value not provided or empty.
   * @returns {Object} containing the new settings value
   */
  async updateSystemSettings(value = {}) {
    if (isEmpty(value)) throw new Error("No value provided to update settings");

    //Filter out the current settings from cache
    const settingsDatabaseID = this.currentServerSettings._id;

    // Find the filter and update the server settings with the new value...
    const updatedSettings = await ServerSettingsDB.findOneAndUpdate(
      { _id: settingsDatabaseID },
      { server: value },
      {
        new: true
      }
    );
    // Make sure to replicate the changes in cache.
    this.currentServerSettings.server = value;

    return updatedSettings.server;
  }

  /**
   * Updates the polling settings for OctoPrints websocket connection in the database and then the cache.
   * @param {Object} value containing the seconds key for OctoPrints websocket polling. String value of polling time.
   * @throws {Error} value not provided or empty.
   * @returns {Object} containing the new settings value
   */
  async updateOctoPrintTimeoutSettings(value = {}) {
    if (isEmpty(value)) throw new Error("No value provided to update settings");

    //Filter out the current settings from cache
    const settingsDatabaseID = this.currentServerSettings._id;

    // Find the filter and update the server settings with the new value...
    const updatedSettings = await ServerSettingsDB.findOneAndUpdate(
      { _id: filter },
      { timeout: value },
      {
        new: true
      }
    );
    // Make sure to replicate the changes in cache.
    updatedSettings.timeout = value;

    return updatedSettings.timeout;
  }

  /**
   * Updates the polling settings for OctoPrints websocket connection in the database and then the cache.
   * @param {Object} value containing the seconds key for OctoPrints websocket polling. String value of polling time.
   * @throws {Error} value not provided or empty.
   * @returns {Object} containing the new settings value
   */
  async updateFilamentManagerSettings(value = {}) {
    if (isEmpty(value)) throw new Error("No value provided to update settings");

    //Filter out the current settings from cache
    const settingsDatabaseID = this.currentServerSettings._id;

    // Find the filter and update the server settings with the new value...
    const updatedSettings = await ServerSettingsDB.findOneAndUpdate(
      { _id: settingsDatabaseID },
      { filament: value },
      {
        new: true
      }
    );
    // Make sure to replicate the changes in cache.
    this.currentServerSettings.filament = value;

    return updatedSettings.filament;
  }

  /**
   * Updates the polling settings for OctoPrints websocket connection in the database and then the cache.
   * @param {Object} value containing the seconds key for OctoPrints websocket polling. String value of polling time.
   * @throws {Error} value not provided or empty.
   * @returns {Object} containing the new settings value
   */
  async updateHistoryCollectionSettings(value = {}) {
    if (isEmpty(value)) throw new Error("No value provided to update settings");

    //Filter out the current settings from cache
    const settingsDatabaseID = this.currentServerSettings._id;

    // Find the filter and update the server settings with the new value...
    const updatedSettings = await ServerSettingsDB.findOneAndUpdate(
      { _id: filter },
      { history: value },
      {
        new: true
      }
    );
    // Make sure to replicate the changes in cache.
    this.currentServerSettings.history = value;

    return updatedSettings.history;
  }

  /**
   * Updates the polling settings for OctoPrints websocket connection in the database and then the cache.
   * @param {Object} value containing the seconds key for OctoPrints websocket polling. String value of polling time.
   * @throws {Error} value not provided or empty.
   * @returns {Object} containing the new settings value
   */
  async updateInfluxDatabaseSettings(value = {}) {
    if (isEmpty(value)) throw new Error("No value provided to update settings");

    //Filter out the current settings from cache
    const settingsDatabaseID = this.currentServerSettings._id;

    // Find the filter and update the server settings with the new value...
    const updatedSettings = await ServerSettingsDB.findOneAndUpdate(
      { _id: settingsDatabaseID },
      { influxExport: value },
      {
        new: true
      }
    );
    // Make sure to replicate the changes in cache.
    this.currentServerSettings.influxExport = value;

    return updatedSettings.influxExport;
  }

  /**
   * Updates the polling settings for OctoPrints websocket connection in the database and then the cache.
   * @param {Boolean} value containing the seconds key for OctoPrints websocket polling. String value of polling time.
   * @returns {Boolean} containing the new settings value
   */
  async updateOctoPrintFilamentManagerPluginSettings(value = false) {
    //Filter out the current settings from cache
    const settingsDatabaseID = this.currentServerSettings._id;

    // Find the filter and update the server settings with the new value...
    const updatedSettings = await ServerSettingsDB.findOneAndUpdate(
      { _id: settingsDatabaseID },
      { filamentManager: value },
      {
        new: true
      }
    );
    // Make sure to replicate the changes in cache.
    this.currentServerSettings.filamentManager = value;

    return updatedSettings.filamentManager;
  }
}

module.exports = {
  ServerSettingsService
};
