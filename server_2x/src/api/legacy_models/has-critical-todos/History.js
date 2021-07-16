const mongoose = require("mongoose");

// === WIP ===
// TODO in the new printers module
const HistorySchema = new mongoose.Schema({
    printHistory: {
        type: Object,
        required: true
    }
});

const History = mongoose.model("History", HistorySchema);

module.exports = History;