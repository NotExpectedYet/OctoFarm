const mongoose = require("mongoose");

// === WIP ===
// TODO in the new users module
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    group: {
        type: String,
        required: false
    },
    clientSettings: {
        type: Object,
        required: false,
    }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
