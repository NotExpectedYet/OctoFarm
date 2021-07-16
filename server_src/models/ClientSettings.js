const mongoose = require("mongoose");

const ClientSettingsSchema = new mongoose.Schema({
  dashboard: {
    type: Object,
    required: false
  },
  panelView: {
    type: Object,
    required: false
  },
  listView: {
    type: Object,
    required: false
  },
  cameraView: {
    type: Object,
    required: false
  },
  controlSettings: {
    type: Object,
    require: false
  }
});

const ClientSettings = mongoose.model("ClientSettings", ClientSettingsSchema);

module.exports = ClientSettings;
