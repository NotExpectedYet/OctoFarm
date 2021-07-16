const mongoose = require("mongoose");

// === WIP ===
// TODO in the new monitoring module
const FarmInfoSchema = new mongoose.Schema({
    farmStart: {
        type: Date,
        default: Date.now
    },
    heatMap: {
        type: Object,
        required: false
    }
});

const FarmInfo = mongoose.model("FarmInfo", FarmInfoSchema);

module.exports = FarmInfo;