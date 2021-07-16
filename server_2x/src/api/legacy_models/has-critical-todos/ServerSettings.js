const mongoose = require("mongoose");

// === WIP ===
// TODO in the new settings module
const ServerSettingsSchema = new mongoose.Schema({
  onlinePolling: {
    type: Object,
    required: true,
  },
  server: {
    type: Object,
    required: false,
  },
  timeout: {
    type: Object,
    required: false,
  },
  filamentManager: {
    type: Boolean,
    required: false,
  },
  filament: {
    type: Object,
    required: false,
  },
  history: {
    type: Object,
    required: false,
  },
  influxExport: {
    type: Object,
    required: false,
  },
});

const ServerSettings = mongoose.model("ServerSettings", ServerSettingsSchema);

module.exports = ServerSettings;
