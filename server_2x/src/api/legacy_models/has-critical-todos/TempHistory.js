const mongoose = require("mongoose");

// === WIP ===
// TODO in the new printers module
const TempHistorySchema = new mongoose.Schema(
  {
    currentTemp: {
      type: Object,
      required: true,
    },
    printer_id: {
      type: String,
      required: true,
    },
  },
  { capped: true, size: 10000, max: 1000000 }
);

const TempHistory = mongoose.model("TempHistory", TempHistorySchema);

module.exports = TempHistory;
