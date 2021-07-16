"use strict";

const ClientSettings = require("../../models/ClientSettings.js");
const ServerSettings = require("../../models/ServerSettings.js");

let systemClean = [];
let clientClean = [];

class SettingsClean {
  static returnSystemSettings() {
    return systemClean;
  }

  static returnClientSettings() {
    return clientClean;
  }

  /**
   * Fetch the first client and server settings entries from database
   * @returns {Promise<void>}
   */
  static async start() {
    // TODO this cache is nice and all, but also the start of many problems of inconsistencies
    // TODO cont'd - What if you forget to persist a setting change to database? This file acts as a cache, so where are the persistence functions?
    const clientSettings = await ClientSettings.find({});
    const serverSettings = await ServerSettings.find({});
    systemClean = serverSettings[0];
    clientClean = clientSettings[0];
  }
}

module.exports = {
  SettingsClean
};
