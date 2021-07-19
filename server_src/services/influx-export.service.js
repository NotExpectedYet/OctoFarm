const Influx = require("influx");
const Logger = require("../handlers/logger.js");

const logger = new Logger("OctoFarm-Influx");

/**
 * Support setup and export to influx v1.X
 */
class InfluxExportService {
  #db = null;
  #settingsStore;

  constructor({ settingsStore }) {
    this.#settingsStore = settingsStore;
  }

  async optionalInfluxDatabaseSetup() {
    const serverSettings = await this.#settingsStore.getServerSettings();
    const influxSettings = serverSettings.influxExport;

    if (influxSettings?.active) {
      let options = {
        username: influxSettings.username,
        password: influxSettings.password,
        host: influxSettings.host,
        port: influxSettings.port,
        database: influxSettings.database
      };

      this.#db = new Influx.InfluxDB(options);
      await this.checkDatabase(options);

      logger.info("Influx database enabled by settings");
    }
  }

  async checkDatabase(options) {
    const names = await this.#db.getDatabaseNames();
    if (!names.includes(options.database)) {
      logger.info("Cannot find database... creating new database: " + options.database);
      await this.#db.createDatabase(options.database);
      return "database created...: " + options.database;
    } else {
      logger.info("Database found! :" + options.database);
      return "database exists... skipping";
    }
  }

  async writePoints(tags, measurement, dataPoints) {
    if (this.#db !== null) {
      await this.#db
        .writePoints([
          {
            measurement: measurement,
            tags: tags,
            fields: dataPoints
          }
        ])
        .catch((err) => {
          logger.error(`Error saving data to InfluxDB! ${err.stack}`);
        });
    } else {
      logger.error(`InfluxDB is null... ignoring until setup...`);
    }
  }

  // let influxCounter = 2000;
  // sendToInflux(printersInformation) {
  //   printersInformation.forEach((printer) => {
  //     const date = Date.now();
  //     let group = " ";
  //     if (printer.group === "") {
  //       group = " ";
  //     } else {
  //       group = printer.group;
  //     }
  //
  //     const tags = {
  //       name: printer.printerName,
  //       group: group,
  //       url: printer.printerURL,
  //       state: printer.printerState.state,
  //       stateCategory: printer.printerState.colour.category,
  //       host_state: printer.hostState.state,
  //       websocket_state: printer.webSocketState.colour,
  //       octoprint_version: printer.octoPrintVersion
  //     };
  //     const printerData = {
  //       name: printer.printerName,
  //       group: group,
  //       url: printer.printerURL,
  //       state: printer.printerState.state,
  //       host_state: printer.hostState.state,
  //       websocket_state: printer.webSocketState.colour,
  //       octoprint_version: printer.octoPrintVersion,
  //       group: group,
  //       state_category: printer.printerState.colour.category,
  //       current_idle_time: parseFloat(printer.currentIdle),
  //       current_active_time: parseFloat(printer.currentActive),
  //       current_offline_time: parseFloat(printer.currentOffline),
  //       date_added: parseFloat(printer.dateAdded),
  //       storage_free: parseFloat(printer.storage.free),
  //       storage_total: parseFloat(printer.storage.total),
  //       timestamp: date
  //     };
  //     if (typeof printer.resends !== "undefined") {
  //       printerData["job_resends"] = `${printer.resends.count} / ${
  //         printer.resends.transmitted / 1000
  //       }K (${printer.resends.ratio.toFixed(0)}`;
  //     }
  //
  //     if (typeof printer.currentJob !== "undefined" && printer.currentJob !== null) {
  //       for (const key in printer.currentJob) {
  //         if (printer.currentJob.hasOwnProperty(key)) {
  //           if (key === "progress" && printer.currentJob[key] !== null) {
  //             printerData["job_progress"] = parseFloat(printer.currentJob[key]);
  //           }
  //           if (key === "fileName" && printer.currentJob[key] !== null) {
  //             printerData["job_file_name"] = printer.currentJob[key];
  //           }
  //           if (key === "fileDisplay" && printer.currentJob[key] !== null) {
  //             printerData["job_file_display"] = printer.currentJob[key];
  //           }
  //           if (key === "filePath" && printer.currentJob[key] !== null) {
  //             printerData["job_file_path"] = printer.currentJob[key];
  //           }
  //           if (key === "expectedCompletionDate" && printer.currentJob[key] !== null) {
  //             printerData["job_expected_completion_date"] = printer.currentJob[key];
  //           }
  //           if (key === "expectedPrintTime" && printer.currentJob[key] !== null) {
  //             printerData["job_expected_print_time"] = parseFloat(printer.currentJob[key]);
  //           }
  //           if (key === "expectedFilamentCosts" && printer.currentJob[key] !== null) {
  //           }
  //           if (key === "expectedPrinterCosts" && printer.currentJob[key] !== null) {
  //             printerData["job_expected_print_cost"] = parseFloat(printer.currentJob[key]);
  //           }
  //           if (key === "expectedTotals" && printer.currentJob[key] !== null) {
  //           }
  //           if (key === "currentZ" && printer.currentJob[key] !== null) {
  //             printerData["job_current_z"] = parseFloat(printer.currentJob[key]);
  //           }
  //           if (key === "printTimeElapsed" && printer.currentJob[key] !== null) {
  //             printerData["job_print_time_elapsed"] = parseFloat(printer.currentJob[key]);
  //           }
  //           if (key === "printTimeRemaining" && printer.currentJob[key] !== null) {
  //             printerData["job_print_time_remaining"] = parseFloat(printer.currentJob[key]);
  //           }
  //           if (key === "averagePrintTime" && printer.currentJob[key] !== null) {
  //             printerData["job_average_print_time"] = parseFloat(printer.currentJob[key]);
  //           }
  //           if (key === "lastPrintTime" && printer.currentJob[key] !== null) {
  //             printerData["job_last_print_time"] = parseFloat(printer.currentJob[key]);
  //           }
  //           if (key === "thumbnail" && printer.currentJob[key] !== null) {
  //             printerData["job_thumbnail"] = printer.currentJob[key];
  //           }
  //         }
  //       }
  //     }
  //
  //     if (printer.selectedFilament.length >= 1) {
  //       printer.selectedFilament.forEach((spool, index) => {
  //         if (spool !== null) {
  //           printerData[`tool_${index}_spool_name`] = spool.spools.name;
  //           printerData[`tool_${index}_spool_used`] = parseFloat(spool.spools.used);
  //           printerData[`tool_${index}_spool_weight`] = parseFloat(spool.spools.weight);
  //           printerData[`tool_${index}_spool_temp_offset`] = parseFloat(spool.spools.tempOffset);
  //           if (typeof spool.spools.material !== "undefined") {
  //             printerData[`tool_${index}_spool_material`] = spool.spools.material;
  //           }
  //         }
  //       });
  //     }
  //
  //     if (
  //       typeof printer.tools !== "undefined" &&
  //       printer.tools !== null &&
  //       printer.tools[0] !== null
  //     ) {
  //       for (const key in printer.tools[0]) {
  //         if (printer.tools[0].hasOwnProperty(key)) {
  //           if (key !== "time") {
  //             if (printer.tools[0][key].actual !== null) {
  //               printerData[key + "_actual"] = parseFloat(printer.tools[0][key].actual);
  //             } else {
  //               printerData[key + "_actual"] = 0;
  //             }
  //             if (printer.tools[0][key].target !== null) {
  //               printerData[key + "_target"] = parseFloat(printer.tools[0][key].target);
  //             } else {
  //               printerData[key + "_target"] = 0;
  //             }
  //           }
  //         }
  //       }
  //     }
  //     writePoints(tags, "PrintersInformation", printerData);
  //   });
  // }
}

module.exports = InfluxExportService;
