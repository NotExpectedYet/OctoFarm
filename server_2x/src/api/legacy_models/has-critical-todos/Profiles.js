const mongoose = require("mongoose");

// === WIP ===
// TODO in the new printers module
const ProfileSchema = new mongoose.Schema({
  profile: {
    type: Object,
    required: true
  },
});
const Profile = mongoose.model("Profile", ProfileSchema);

module.exports = Profile;