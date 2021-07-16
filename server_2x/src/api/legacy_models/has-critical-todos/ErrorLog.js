const mongoose = require("mongoose");

// === WIP ===
// TODO in the new monitoring module
const ErrorLogSchema = new mongoose.Schema({
    errorLog: {
        type: Object,
        required: true
    }
});

const ErrorLog = mongoose.model("ErrorLog", ErrorLogSchema);

module.exports = ErrorLog;