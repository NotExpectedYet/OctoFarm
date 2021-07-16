const mongoose = require("mongoose");

const RoomDataSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true
    },
    temperature: {
      type: Number,
      required: false
    },
    pressure: {
      type: Number,
      required: false
    },
    humidity: {
      type: Number,
      required: false
    },
    iaq: {
      type: Number,
      required: false
    }
  },
  { capped: true, size: 10000, max: 1000000 }
);

const RoomData = mongoose.model("RoomData", RoomDataSchema);

module.exports = RoomData;
