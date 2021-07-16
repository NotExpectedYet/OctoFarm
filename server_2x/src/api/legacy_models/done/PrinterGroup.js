// === DONE ===
// const mongoose = require("mongoose");
// const Schema = require("mongoose/lib/schema");
// const {arrayValidator} = require("../utils/validators");
//
// const PrinterGroupSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   printers: {
//     type: [{
//       type: Schema.Types.ObjectId,
//       required: true,
//     }],
//     validate: [arrayValidator(0), "{PATH} not within constrained lengths."],
//   },
// });
//
// const PrinterGroup = mongoose.model("PrinterGroup", PrinterGroupSchema);
//
// module.exports = PrinterGroup;
// === END DONE ===