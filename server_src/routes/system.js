const express = require("express");

const router = express.Router();

const multer = require("multer");

// Multer setup for disk storage of background file...

const Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./images");
  },
  filename: function (req, file, callback) {
    callback(null, "bg.jpg");
  }
});

const upload = multer({ storage: Storage });

const prettyHelpers = require("../../views/partials/functions/pretty.js");
const { SystemRunner } = require("../runners/systemInfo.js");

const isDocker = require("is-docker");
const softwareUpdateChecker = require("../runners/softwareUpdateChecker");
const { ensureAuthenticated } = require("../config/auth.js");
const { ensureCurrentUserAndGroup } = require("../middleware/users.js");
const { AppConstants } = require("../app.constants");
const {
  getDefaultDashboardSettings
} = require("../lib/providers/settings.constants");
const { Runner } = require("../runners/state");
const { fetchMongoDBConnectionString } = require("../../app-env");
const { isPm2, isNodemon, isNode } = require("../utils/env.utils.js");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean");
const { getServerSettingsCache } = require("../cache/server-settings.cache.js");
const { Logs } = require("../lib/serverLogs.js");
const { SystemCommands } = require("../lib/serverCommands.js");
const {
  checkReleaseAndLogUpdate,
  getUpdateNotificationIfAny
} = require("../runners/softwareUpdateChecker.js");
const HistoryDB = require("../models/History.js");
const SpoolsDB = require("../models/Filament.js");
const ProfilesDB = require("../models/Profiles.js");
const roomDataDB = require("../models/RoomData.js");
const UserDB = require("../models/User.js");
const PrinterDB = require("../models/Printer.js");
const AlertsDB = require("../models/Alerts.js");
const ClientSettingsDB = require("../models/ClientSettings.js");
const GcodeDB = require("../models/CustomGcode.js");

const Logger = require("../lib/logger.js");
const logger = new Logger("OctoFarm-API", true, "error");

router.get(
  "/",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const clientSettings = await SettingsClean.returnClientSettings();
    const systemInformation = await SystemRunner.querySystemInfo();
    const printers = Runner.returnFarmPrinters();
    const softwareUpdateNotification =
      softwareUpdateChecker.getUpdateNotificationIfAny();
    let dashboardSettings =
      clientSettings?.dashboard || getDefaultDashboardSettings();



    res.render("system", {
      name: req.user.name,
      userGroup: req.user.group,
      version: process.env[AppConstants.VERSION_KEY],
      printerCount: printers.length,
      page: "System",
      octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
      helpers: prettyHelpers,
      clientSettings,
      serverSettingsCache: req.serverSettingsCache,
      systemInformation,
      db: fetchMongoDBConnectionString(),
      dashboardSettings: dashboardSettings,
      serviceInformation: {
        isDockerContainer: isDocker(),
        isNodemon: isNodemon(),
        isNode: isNode(),
        isPm2: isPm2(),
        update: softwareUpdateNotification
      },
      patreonData: require('../patreon.data.js')
    });
  }
);

/**
 * Acquire system information from system info runner
 */
router.get("/info", ensureAuthenticated, async (req, res) => {
  const systemInformation = await SystemRunner.queryWithFreshCurrentProcess();
  res.send(systemInformation);
});

/**
 * System Settings Endpoints
 */
router.post(
  "/background",
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

router.get("/settings", ensureAuthenticated, (req, res) => {
  res.send(getServerSettingsCache().entireServerSettingsObject);
});

router.post("/settings", ensureAuthenticated, async (req, res) => {
  console.log(req.body);

  // ServerSettingsDB.find({}).then(async (checked) => {
  //   checked[0].onlinePolling = req.body.onlinePolling;
  //   Runner.updatePoll();
  //   checked[0].server = req.body.server;
  //   checked[0].timeout = req.body.timeout;
  //   checked[0].filament = req.body.filament;
  //   checked[0].history = req.body.history;
  //   checked[0].influxExport = req.body.influxExport;
  //   //Check the influx export to see if all information exists... disable if not...
  //   let shouldDisableInflux = false;
  //   let returnMsg = "";
  //   let influx = req.body.influxExport;
  //   if (req.body.influxExport.active) {
  //     if (influx.host.length === 0) {
  //       shouldDisableInflux = true;
  //       returnMsg += "Issue: No host information! <br>";
  //     }
  //     if (influx.port.length === 0) {
  //       shouldDisableInflux = true;
  //       returnMsg += "Issue: No port information! <br>";
  //     }
  //     if (influx.database.length === 0 || influx.database.includes(" ")) {
  //       shouldDisableInflux = true;
  //       returnMsg += "Issue: No database name or contains spaces! <br>";
  //     }
  //     if (shouldDisableInflux) {
  //       checked[0].influxExport.active = false;
  //       checked[0].markModified("influxExport");
  //     }
  //   }
  //
  //   if (shouldDisableInflux) {
  //     res.send({
  //       msg: returnMsg,
  //       status: "warning"
  //     });
  //   } else {
  //     res.send({ msg: "Settings Saved", status: "success" });
  //   }
  // });
});

/**
 * System Action Command Endpoints
 */
router.post("/restart", ensureAuthenticated, async (req, res) => {
  let serviceRestarted = false;
  try {
    serviceRestarted = await SystemCommands.rebootOctoFarm();
  } catch (e) {
    logger.error(e);
  }
  res.send(serviceRestarted);
});

router.get("/update", ensureAuthenticated, async (req, res) => {
  await checkReleaseAndLogUpdate();
  const softwareUpdateNotification = getUpdateNotificationIfAny();
  res.send(softwareUpdateNotification);
});

router.post("/update", ensureAuthenticated, async (req, res) => {
  let clientResponse = {
    haveWeSuccessfullyUpdatedOctoFarm: false,
    statusTypeForUser: "error",
    message: ""
  };
  let force = req?.body;
  if (
    !force ||
    typeof force?.forcePull !== "boolean" ||
    typeof force?.doWeInstallPackages !== "boolean"
  ) {
    res.sendStatus(400);
    throw new Error("forceCheck object not correctly provided or not boolean");
  }

  try {
    clientResponse = await SystemCommands.checkIfOctoFarmNeedsUpdatingAndUpdate(
      clientResponse,
      force
    );
  } catch (e) {
    clientResponse.message =
      "Issue with updating | " + e?.message.replace(/(<([^>]+)>)/gi, "");
    // Log error with html tags removed if contained in response message
    logger.error(
      "Issue with updating | ",
      e?.message.replace(/(<([^>]+)>)/gi, "")
    );
  } finally {
    res.send(clientResponse);
  }
});

/**
 * System Log Endpoints
 */

router.get("/log/:name", ensureAuthenticated, (req, res) => {
  const download = req.params.name;
  const file = `./logs/${download}`;
  res.download(file, download); // Set disposition and send it.
});

router.get("/logs", ensureAuthenticated, async (req, res) => {
  const serverLogs = await Logs.grabLogs();
  res.send(serverLogs);
});

router.post("/logs/generateLogDump", ensureAuthenticated, async (req, res) => {
  // Will use in a future update to configure the dump.
  // let settings = req.body;
  // Generate the log package
  let zipDumpResponse = {
    status: "error",
    msg: "Unable to generate zip file, please check 'OctoFarm-API.log' file for more information.",
    zipDumpPath: ""
  };

  try {
    zipDumpResponse.zipDumpPath = await Logs.generateOctoFarmLogDump();
    zipDumpResponse.status = "success";
    zipDumpResponse.msg =
      "Successfully generated zip file, please click the download button.";
  } catch (e) {
    logger.error("Error Generating Log Dump Zip File | ", e);
  }

  res.send(zipDumpResponse);
});
/**
 * Database Action Endpoints
 */
router.delete("/databases", ensureAuthenticated, async (req, res) => {
  await getServerSettingsCache().resetServerSettingsToDefault;
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
    message: "Successfully deleted databases, server will restart..."
  });
  await SystemCommands.rebootOctoFarm();
  res.send({
    message: "Successfully deleted " + databaseName + ", server will restart..."
  });
  await SystemCommands.rebootOctoFarm();
});

router.get("/database/:name", ensureAuthenticated, async (req, res) => {
  const databaseName = req.params.name;
  let returnedObjects = [];
  if (databaseName === "FilamentDB") {
    returnedObjects.push(await ProfilesDB.find({}));
    returnedObjects.push(await SpoolsDB.find({}));
    // TODO: The below else, will replace the final else... needs to check for now until rest of db's migrated to cache.
  } else if (databaseName === "ServerSettings") {
    returnedObjects.push(
      await eval(`get${databaseName}Cache().entire${databaseName}Object`)
    );
  } else {
    returnedObjects.push(await eval(databaseName).find({}));
  }
  res.send({ databases: returnedObjects });
});

router.delete("/database/:name", ensureAuthenticated, async (req, res) => {
  const databaseName = req.params.name;
  if (databaseName === "FilamentDB") {
    await SpoolsDB.deleteMany({});
    await ProfilesDB.deleteMany({});
    res.send({
      message: "Successfully deleted Spools database server will restart..."
    });
    await SystemCommands.rebootOctoFarm();
  } else {
    // TODO: The below else, will replace the final else... needs to check for now until rest of db's migrated to cache due to function changes.
    if (databaseName === "ServerSettings") {
      await eval(`get${databaseName}Cache().reset${databaseName}ToDefault`);
    } else {
      await eval(databaseName).deleteMany({});
    }
    res.send({
      message: `Successfully deleted ${databaseName}, server will restart`
    });
    await SystemCommands.rebootOctoFarm();
  }
});

module.exports = router;
