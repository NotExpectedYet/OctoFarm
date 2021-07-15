const Printer = require("../models/Printer");

module.exports = class PrinterSchemaMigrator13072021 {
  async up(schemaVersion) {
    // Do the migration
    // Change the schema version if we may

    Printer.updateMany({}, { $rename: { settingsApperance: "settingsAppearance" } });
    Printer.updateMany({}, { $rename: { apikey: "apiKey" } });
  }

  down(schemaVersion) {}
};

module.exports = PrinterSchemaMigrator13072021;
