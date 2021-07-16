const express = require('express');

const router = express.Router();

const { ensureAuthenticated } = require('../../server/src/auth/config/auth');

const RoomData = require("../models/roomData.js");

router.post('/roomData', ensureAuthenticated, async (req, res) => {
    const enviromentData = req.body;
    const databaseData = await new RoomData(enviromentData);
    databaseData.save();
});

module.exports = router;
