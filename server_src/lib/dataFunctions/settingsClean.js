"use strict";

const ClientSettings = require("../../models/ClientSettings.js");

let clientClean = [];

class SettingsClean {
  static async returnClientSettings() {
    return clientClean;
  }

  static async start() {
    const clientSettings = await ClientSettings.find({});
    clientClean = clientSettings[0];
  }
}

module.exports = {
  SettingsClean
};
