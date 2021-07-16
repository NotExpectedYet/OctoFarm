const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  profile: {
    type: Object,
    required: true
  }
});
const Profiles = mongoose.model("Profile", ProfileSchema);

module.exports = Profiles;
