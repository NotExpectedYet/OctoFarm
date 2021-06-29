const mongoose = require("mongoose");

const OctoprintAnnouncementSchema = new mongoose.Schema({
  isRegistered: {
    type: Boolean,
    default: false,
    required: true
  },
  dateAdded: {
    type: Number,
    default: Date.now,
    required: true
  },
  dateRegistered: {
    type: Number,
    required: false
  },
  deviceUuid: {
    type: String,
    required: true
  },
  persistenceUuid: {
    type: String,
    required: true
  },
  host: {
    type: String,
    required: false
  },
  port: {
    type: Number,
    required: false
  },
  secured: {
    type: Boolean,
    required: true
  },
  docker: {
    type: Boolean,
    required: true
  },
  allowCrossOrigin: {
    type: Boolean,
    required: true
  }
});

OctoprintAnnouncementSchema.index(
  { deviceUuid: 1, persistenceUuid: 1 },
  { unique: true }
);

const OctoprintAnnouncement = mongoose.model(
  "OctoprintAnnouncement",
  OctoprintAnnouncementSchema
);

module.exports = OctoprintAnnouncement;
