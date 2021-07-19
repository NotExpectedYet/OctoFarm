const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../../middleware/auth");
const Logger = require("../../handlers/logger.js");

class SettingsController {
  #logger = new Logger("OctoFarm-API");

  constructor({}) {}

  getClientSettings(req, res) {
    ClientSettingsDB.find({}).then((checked) => {
      res.send(checked[0]);
    });
  }

  updateClientSettings(req, res) {
    ClientSettingsDB.find({}).then((checked) => {
      const panelView = {
        currentOp: req.body.panelView.currentOp,
        hideOff: req.body.panelView.hideOff,
        hideClosed: req.body.panelView.hideClosed,
        hideIdle: req.body.panelView.hideIdle,
        printerRows: req.body.cameraView.cameraRows
      };
      checked[0].panelView = panelView;
      checked[0].dashboard = req.body.dashboard;
      checked[0].controlSettings = req.body.controlSettings;
      checked[0].markModified("controlSettings");
      checked[0].save().then(() => {
        SettingsClean.start();
      });
      res.send({ msg: "Settings Saved" });
    });
  }

  getServerSettings(req, res) {
    ServerSettingsDB.find({}).then((checked) => {
      res.send(checked[0]);
    });
  }

  updateServerSettings(req, res) {
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
          status: "warning"
        });
      } else {
        res.send({ msg: "Settings Saved", status: "success" });
      }
    });
  }
}

// prettier-ignore
module.exports = createController(SettingsController)
  .prefix("/settings")
  .before([ensureAuthenticated])
  .get("/client/get", "getClientSettings")
  .post("/client/update", "updateClientSettings")
  .get("/server/get", "getServerSettings")
  .post("/server/update", "updateServerSettings");
