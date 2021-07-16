const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema({
  printHistory: {
    type: Object,
    required: true
  }
});

const History = mongoose.model("History", HistorySchema);

module.exports = History;
