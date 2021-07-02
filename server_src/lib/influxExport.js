// Support for influx v1.X

const Influx = require("influx");
const { getServerSettingsCache } = require("../cache/server-settings.cache.js");
const Logger = require("../lib/logger.js");

const logger = new Logger("OctoFarm-Server");

let db = null;

async function optionalInfluxDatabaseSetup() {
  let influxDatabaseSettings = getServerSettingsCache().influxDatabaseSettings;
  if (influxDatabaseSettings.active) {
    let options = {
      username: influxDatabaseSettings.username,
      password: influxDatabaseSettings.password,
      host: influxDatabaseSettings.host,
      port: influxDatabaseSettings.port,
      database: influxDatabaseSettings.database
    };

    db = new Influx.InfluxDB(options);
    await checkDatabase(options);

    return "Setup";
  } else {
    logger.info("Influx database is disabled");
  }
}

async function checkDatabase(options) {
  const names = await db.getDatabaseNames();
  if (!names.includes(options.database)) {
    logger.info(
      "Cannot find database... creating new database: " + options.database
    );
    await db.createDatabase(options.database);
    return "database created...: " + options.database;
  } else {
    logger.info("Database found! :" + options.database);
    return "database exists... skipping";
  }
}

function writePoints(tags, measurement, dataPoints) {
  if (db !== null) {
    db.writePoints([
      {
        measurement: measurement,
        tags: tags,
        fields: dataPoints
      }
    ]).catch((err) => {
      logger.error(`Error saving data to InfluxDB! ${err.stack}`);
    });
  } else {
    logger.error("InfluxDB is null... ignoring until setup...");
  }
}

module.exports = {
  optionalInfluxDatabaseSetup,
  checkDatabase,
  writePoints
};
