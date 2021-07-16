const { createController } = require("awilix-express");

class HistoryController {
  #serverVersion;
  #settingsStore;
  #historyCache;
  #octoFarmPageTitle;

  constructor({ settingsStore, serverVersion, octoFarmPageTitle, historyCache }) {
    this.#settingsStore = settingsStore;
    this.#historyCache = historyCache;
    this.#serverVersion = serverVersion;
    this.#octoFarmPageTitle = octoFarmPageTitle;
  }

  async get(req, res) {
    res.send({ history: this.#historyCache.historyClean });
  }

  async delete(req, res) {
    const deleteHistory = req.body;
    await History.findOneAndDelete({ _id: deleteHistory.id }).then(() => {
      this.#historyCache.initCache();
    });
    res.send("success");
  }

  async update(req, res) {
    // Check required fields
    const latest = req.body;
    const { note } = latest;
    const { filamentId } = latest;
    const history = await History.findOne({ _id: latest.id });
    if (history.printHistory.notes != note) {
      history.printHistory.notes = note;
    }
    for (let f = 0; f < filamentId.length; f++) {
      if (Array.isArray(history.printHistory.filamentSelection)) {
        if (
          typeof history.printHistory.filamentSelection[f] !== "undefined" &&
          history.printHistory.filamentSelection[f] !== null &&
          history.printHistory.filamentSelection[f]._id == filamentId
        ) {
          //Skip da save
        } else {
          if (filamentId[f] != 0) {
            const serverSettings = await ServerSettings.find({});
            const spool = await Spools.findById(filamentId[f]);

            if (serverSettings[0].filamentManager) {
              const profiles = await Profiles.find({});
              const profileIndex = _.findIndex(profiles, function (o) {
                return o.profile.index == spool.spools.profile;
              });
              spool.spools.profile = profiles[profileIndex].profile;
              history.printHistory.filamentSelection[f] = spool;
            } else {
              const profile = await Profiles.findById(spool.spools.profile);
              spool.spools.profile = profile.profile;
              history.printHistory.filamentSelection[f] = spool;
            }
          } else {
            filamentId.forEach((id, index) => {
              history.printHistory.filamentSelection[index] = null;
            });
          }
        }
      } else {
        if (
          history.printHistory.filamentSelection !== null &&
          history.printHistory.filamentSelection._id == filamentId
        ) {
          //Skip da save
        } else {
          history.printHistory.filamentSelection = [];
          if (filamentId[f] != 0) {
            const serverSettings = await ServerSettings.find({});
            const spool = await Spools.findById(filamentId[f]);

            if (serverSettings[0].filamentManager) {
              const profiles = await Profiles.find({});
              const profileIndex = _.findIndex(profiles, function (o) {
                return o.profile.index == spool.spools.profile;
              });
              spool.spools.profile = profiles[profileIndex].profile;
              history.printHistory.filamentSelection[f] = spool;
            } else {
              const profile = await Profiles.findById(spool.spools.profile);
              spool.spools.profile = profile.profile;
              history.printHistory.filamentSelection[f] = spool;
            }
          } else {
            filamentId.forEach((id, index) => {
              history.printHistory.filamentSelection[index] = null;
            });
          }
        }
      }
    }
    history.markModified("printHistory");
    history.save().then(() => {
      getHistoryCache().initCache();
    });
    res.send("success");
  }

  async stats(req, res) {
    const stats = this.#historyCache.generateStatistics();
    res.send({ history: stats });
  }

  /**
   * Get specific printer statistics, although I have no idea why that's related to history
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  async printerStats(req, res) {
    const printerID = req.params.id;
    let stats = await PrinterClean.generatePrinterStatistics(printerID);
    res.send(stats);
  }

  async updateCostMatch(req, res) {
    const latest = req.body;

    // Find history and matching printer ID
    const historyEntity = await History.findOne({ _id: latest.id });
    const printers = await Printers.find({});
    const printer = _.findIndex(printers, function (o) {
      return o.settingsApperance.name == historyEntity.printHistory.printerName;
    });
    if (printer > -1) {
      historyEntity.printHistory.costSettings = printers[printer].costSettings;
      historyEntity.markModified("printHistory");
      historyEntity.save();
      const send = {
        status: 200,
        printTime: historyEntity.printHistory.printTime,
        costSettings: printers[printer].costSettings
      };
      res.send(send);
    } else {
      historyEntity.printHistory.costSettings = {
        powerConsumption: 0.5,
        electricityCosts: 0.15,
        purchasePrice: 500,
        estimateLifespan: 43800,
        maintenanceCosts: 0.25
      };
      const send = {
        status: 400,
        printTime: historyEntity.printHistory.printTime,
        costSettings: historyEntity.printHistory.costSettings
      };
      historyEntity.markModified("printHistory");
      historyEntity.save().then(() => {
        getHistoryCache().initCache();
      });

      res.send(send);
    }
  }
}

// prettier-ignore
module.exports = createController(HistoryController)
  .prefix("/history")
  .before([])
  .get("/get", "get")
  .delete("/delete", "delete")
  .post("/update", "update")
  .get("/stats", "stats")
  .get("/printer-stats/:id", "printerStats")
  .post("/updateCostMatch", "updateCostMatch");
