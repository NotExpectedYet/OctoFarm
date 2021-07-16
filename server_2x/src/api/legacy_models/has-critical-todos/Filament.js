const mongoose = require("mongoose");

// === WIP ===
// TODO in the new printers module + renamed schema/table... roll, spool, filament = inconsistency
const RollSchema = new mongoose.Schema({
  spools: {
    type: Object,
    required: true
  },
});

const Spool = mongoose.model("Spool", RollSchema);

module.exports = Spool;
