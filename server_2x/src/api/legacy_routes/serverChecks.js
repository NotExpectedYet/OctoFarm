const express = require("express");

const router = express.Router();

//const { ServerChecks } = require("../systemRunners/system/serverChecks.js");

router.get("/amialive", async (req, res) => {
    res.json(true);
});

module.exports = router;