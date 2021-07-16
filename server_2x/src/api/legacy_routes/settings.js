const express = require("express");

const router = express.Router();
const { ensureAuthenticated } = require("../../server/src/auth/config/auth");
const ServerSettingsDB = require("../models/ServerSettings.js");
const ClientSettingsDB = require("../models/ClientSettings.js");
const HistoryDB = require("../models/History");
const SpoolsDB = require("../models/Filament.js");
const ProfilesDB = require("../models/Profiles.js");
const roomDataDB = require("../models/roomData.js");
const UserDB = require("../models/User.js");
const PrinterDB = require("../models/Printer.js");
const AlertsDB = require("../models/Alerts.js");
const GcodeDB = require("../models/CustomGcode.js");

const Logger = require("../../server/src/printers/lib/logger.js");

const logger = new Logger("OctoFarm-API");

const runner = require("../../server/src/printers/runners/state.js");
const multer = require("multer");

const { Runner } = runner;

const systemInfo = require("../../server/src/printers/runners/systemInfo.js");

const SystemInfo = systemInfo.SystemRunner;

const settingsClean = require("../../server/src/printers/lib/dataFunctions/settingsClean.js");

const { SettingsClean } = settingsClean;

const serverCommands = require("../../server/src/printers/lib/serverCommands.js");

const { Logs } = serverCommands;
const { SystemCommands } = serverCommands;

module.exports = router;

// var upload = multer({ dest: "Upload_folder_name" })
// If you do not want to use diskStorage then uncomment it

const Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./images");
  },
  filename: function (req, file, callback) {
    callback(null, "bg.jpg");
  },
});

const upload = multer({ storage: Storage });

router.get("/server/get/logs", ensureAuthenticated, async (req, res) => {
  const serverLogs = await Logs.grabLogs();
  res.send(serverLogs);
});
router.get("/server/download/logs/:name", ensureAuthenticated, (req, res) => {
  const download = req.params.name;
  const file = `./logs/${download}`;
  res.download(file, download); // Set disposition and send it.
});
router.get(
  "/server/delete/database/:name",
  ensureAuthenticated,
  async (req, res) => {
    const databaseName = req.params.name;
    console.log(databaseName);
    await Runner.pause();
    if (databaseName === "nukeEverything") {
      await ServerSettingsDB.deleteMany({});
      await ClientSettingsDB.deleteMany({});
      await HistoryDB.deleteMany({});
      await SpoolsDB.deleteMany({});
      await ProfilesDB.deleteMany({});
      await roomDataDB.deleteMany({});
      await UserDB.deleteMany({});
      await PrinterDB.deleteMany({});
      await AlertsDB.deleteMany({});
      await GcodeDB.deleteMany({});
      res.send({
        message: "Successfully deleted databases, server will restart...",
      });
      logger.info("Database completely wiped.... Restarting server...");
      SystemCommands.rebootOctoFarm();
    } else if (databaseName === "FilamentDB") {
      await SpoolsDB.deleteMany({});
      await ProfilesDB.deleteMany({});
      logger.info(
        "Successfully deleted Filament database.... Restarting server..."
      );
      SystemCommands.rebootOctoFarm();
    } else {
      await eval(databaseName).deleteMany({});
      res.send({
        message:
          "Successfully deleted " + databaseName + ", server will restart...",
      });
      logger.info(
        databaseName + " successfully deleted.... Restarting server..."
      );
      SystemCommands.rebootOctoFarm();
    }
  }
);
router.get("/server/restart", ensureAuthenticated, (req, res) => {
  SystemCommands.rebootOctoFarm();
});
router.get("/client/get", ensureAuthenticated, (req, res) => {
  ClientSettingsDB.find({}).then((checked) => {
    res.send(checked[0]);
  });
});
router.post("/client/update", ensureAuthenticated, (req, res) => {
  ClientSettingsDB.find({}).then((checked) => {
    const panelView = {
      currentOp: req.body.panelView.currentOp,
      hideOff: req.body.panelView.hideOff,
      hideClosed: req.body.panelView.hideClosed,
      hideIdle: req.body.panelView.hideIdle,
      printerRows: req.body.cameraView.cameraRows,
    };
    checked[0].panelView = panelView;
    checked[0].dashboard = req.body.dashboard;
    checked[0].controlSettings = req.body.controlSettings;
    checked[0].markModified("controlSettings");
    checked[0].save().then(() => {
      SettingsClean.start();
    });
    console.log("HELLO");
    res.send({ msg: "Settings Saved" });
  });
});
router.post(
  "/backgroundUpload",
  ensureAuthenticated,
  upload.single("myFile"),
  (req, res) => {
    const file = req.file;
    if (!file) {
      res.redirect("/system");
    }
    res.redirect("/system");
  }
);
router.get("/server/get", ensureAuthenticated, (req, res) => {
  ServerSettingsDB.find({}).then((checked) => {
    res.send(checked[0]);
  });
});
router.post("/server/update", ensureAuthenticated, (req, res) => {
  ServerSettingsDB.find({}).then(async (checked) => {
    checked[0].onlinePolling = req.body.onlinePolling;
    Runner.updatePoll();
    checked[0].server = req.body.server;
    checked[0].timeout = req.body.timeout;
    checked[0].filament = req.body.filament;
    checked[0].history = req.body.history;
    checked[0].influxExport = req.body.influxExport;
    //Check the influx export to see if all information exists... disable if not...
    let shouldDisableInflux = false;
    let returnMsg = "";
    let influx = req.body.influxExport;
    if (req.body.influxExport.active) {
      if (influx.host.length === 0) {
        shouldDisableInflux = true;
        returnMsg += "Issue: No host information! <br>";
      }
      if (influx.port.length === 0) {
        shouldDisableInflux = true;
        returnMsg += "Issue: No port information! <br>";
      }
      if (influx.database.length === 0 || influx.database.includes(" ")) {
        shouldDisableInflux = true;
        returnMsg += "Issue: No database name or contains spaces! <br>";
      }
      if (shouldDisableInflux) {
        checked[0].influxExport.active = false;
        checked[0].markModified("influxExport");
      }
    }

    await checked[0].save().then(() => {
      SettingsClean.start();
    });
    if (shouldDisableInflux) {
      res.send({
        msg: returnMsg,
        status: "warning",
      });
    } else {
      res.send({ msg: "Settings Saved", status: "success" });
    }
  });
});
router.get("/sysInfo", ensureAuthenticated, async (req, res) => {
  const systemInformation = await SystemInfo.returnInfo();
  let sysInfo = null;
  if (typeof systemInformation !== "undefined") {
    sysInfo = {
      osInfo: systemInformation.osInfo,
      cpuInfo: systemInformation.cpuInfo,
      cpuLoad: systemInformation.cpuLoad,
      memoryInfo: systemInformation.memoryInfo,
      sysUptime: systemInformation.sysUptime,
      sysProcess: systemInformation.sysProcess,
      processUptime: systemInformation.processUptime,
    };
  }
  res.send(sysInfo);
});
router.get("/customGcode/delete/:id", ensureAuthenticated, async(req, res) => {
  const scriptId = req.params.id;
  GcodeDB.findByIdAndDelete(scriptId, function (err) {
    if(err){
      res.send(err)
    }
    else{
      res.send(scriptId)
    }
  });
});
router.post("/customGcode/edit", ensureAuthenticated, async(req, res) => {
  const newObj = req.body;
  let script = await GcodeDB.findById(newObj.id);
  script.gcode = newObj.gcode;
  script.name = newObj.name;
  script.description = newObj.description
  script.save();
  res.send(script)
});
router.post("/customGcode", ensureAuthenticated, async(req, res) => {
  let newScript = req.body
  const saveScript = new GcodeDB(newScript)
  saveScript.save().then(res.send(saveScript)).catch(e => res.send(e));
});
router.get("/customGcode", ensureAuthenticated, async(req, res) => {
  const all = await GcodeDB.find();
  res.send(all)
})
