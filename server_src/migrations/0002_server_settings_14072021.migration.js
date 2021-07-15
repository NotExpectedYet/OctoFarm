const ServerSettings = require("../models/ServerSettings");

module.exports = class ServerSettingsSchemaMigrator14072021 {
  async up(schemaVersion) {
    // Do the migration
    // Change the schema version if we may

    ServerSettings.updateMany({}, { $rename: { filamentManager: "filamentManagerEnabled" } });
  }

  down(schemaVersion) {}
};

module.exports = ServerSettingsSchemaMigrator14072021;
