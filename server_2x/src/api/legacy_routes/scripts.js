const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../../server/src/auth/config/auth");
// User Modal
const runner = require("../../server/src/printers/runners/state.js");
const Runner = runner.Runner;
const Logger = require('../../server/src/printers/lib/logger.js');
const logger = new Logger('OctoFarm-API');
const Alerts = require("../models/Alerts.js");

const script = require("../../server/src/printers/runners/scriptCheck.js");
const Script = script.ScriptRunner;
router.get("/get", ensureAuthenticated, async (req, res) => {
    //Grab the API body
    const alerts = await Alerts.find({})
    //Return printers added...
    res.send({alerts: alerts, status:200});
});
router.delete("/delete/:id", ensureAuthenticated, async (req, res) => {
    //Grab the API body
    let id = req.params.id;
    await Alerts.deleteOne({_id: id}).then(response => {
        res.send({alerts: "success", status:200});
    }).catch(err => {
        console.log(err)
            res.send({alerts: "error", status:500});
    });
    //Return printers added...

});
router.post("/test", ensureAuthenticated, async (req, res) => {
    //Grab the API body
    const opts = req.body;
    //Send Dashboard to Runner..
    let testFire = await Script.test(opts.scriptLocation, opts.message)
    //Return printers added...
    res.send({testFire: testFire, status:200});
});
router.post("/save", ensureAuthenticated, async (req, res) => {
    //Grab the API body
    const opts = req.body;
    //Send Dashboard to Runner..
    let save = await Script.save(opts.printer, opts.trigger, opts.message, opts.scriptLocation)
    //Return printers added...
    res.send({message: save, status:200});
});
router.post("/edit", ensureAuthenticated, async (req, res) => {
    //Grab the API body
    const opts = req.body;
    //Send Dashboard to Runner..
    let save = await Script.edit(opts)
    //Return printers added...
    res.send({message: save, status:200});
});
module.exports = router;