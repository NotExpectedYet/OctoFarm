const mongoose = require("mongoose");

const SpoolSchema = new mongoose.Schema({
  spools: {
    type: Object,
    required: true
  }
});

const Spool = mongoose.model("Spool", SpoolSchema);

module.exports = Spool;
