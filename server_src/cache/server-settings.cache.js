const {
  ServerSettingsService
} = require("../services/database/server-settings.service.js");

let serverSettingsCache;

function getServerSettingsCache() {
  return serverSettingsCache;
}

async function initializeServerSettingsCache() {
  serverSettingsCache = new ServerSettingsService();

  return serverSettingsCache.init();
}

module.exports = { initializeServerSettingsCache, getServerSettingsCache };
