const mongoose = require("mongoose");
const Schema = require('mongoose/lib/schema');
const {arrayValidator} = require('../../server/src/printers/utils/validators');
const {arrayLengthValidator} = require('../done/PrinterGroup');

// === WIP ===
// TODO in the new printers module
const PrinterSchema = new mongoose.Schema({
  category: {
    type: String,
    required: false,
  },
  dateAdded: {
    type: Number,
    required: false,
  },
  currentIdle: {
    type: Number,
    required: false,
  },
  currentActive: {
    type: Number,
    required: false,
  },
  currentOffline: {
    type: Number,
    required: false,
  },
  type: {
    type: String,
    required: false,
  },
  sortIndex: {
    type: Number,
    required: false,
  },
  ip: {
    type: String,
    required: false,
  },
  port: {
    type: String,
    required: false,
  },
  apikey: {
    type: String,
    required: true,
  },
  camURL: {
    type: String,
    required: false,
  },
  printerURL: {
    type: String,
    required: false,
  },
  octoPrintVersion: {
    type: String,
    required: false,
  },
  klipperFirmwareVersion: {
    type: String,
    required: false,
  },
  feedRate: {
    type: Number,
    required: false,
  },
  flowRate: {
    type: Number,
    required: false,
  },
  settingsApperance: {
    type: Object,
    required: false,
  },
  selectedFilament: {
    type: Object,
    required: false,
  },
  currentUser: {
    type: String,
    required: false,
  },
  group: {
    type: String,
    required: false,
  },
  tempTriggers: {
    type: Object,
    required: false,
  },
  powerSettings: {
    type: Object,
    required: false,
  },
  costSettings: {
    type: Object,
    required: false,
  },
  fileList: {
    type: Object,
    required: false,
  },
  storage: {
    type: Object,
    required: false,
  },
});

const Printer = mongoose.model("Printer", PrinterSchema);

module.exports = Printer;
