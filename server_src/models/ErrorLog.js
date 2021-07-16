const mongoose = require("mongoose");

const ErrorLogSchema = new mongoose.Schema({
  errorLog: {
    type: Object,
    required: true
  }
});

const ErrorLog = mongoose.model("ErrorLog", ErrorLogSchema);

module.exports = ErrorLog;
