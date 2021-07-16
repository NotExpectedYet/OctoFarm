const softwareUpdateChecker = require("./services/octofarm-update.service");
const { Runner } = require("./state/octofarm.manager");
const { FilamentClean } = require("./state/data/filamentClean");
const { initHistoryCache } = require("./state/data/history.cache");
const { TaskPresets } = require("./task.presets");

const CRASH_TEST_TASK = async () => {
  throw new Error("big error");
};

const HISTORY_CACHE_TASK = async () => {
  await initHistoryCache().catch((e) => {
    console.error("X HistoryCache failed to initiate. " + e);
  });
};

const FILAMENT_CLEAN_TASK = async () => {
  await FilamentClean.start();
};

const GITHUB_UPDATE_CHECK_TASK = async () => {
  await softwareUpdateChecker.syncLatestOctoFarmRelease(false).then(() => {
    softwareUpdateChecker.checkReleaseAndLogUpdate();
  });
};

const WEBSOCKET_HEARTBEAT_TASK = () => {
  // farmPrinters.forEach(function each(client) {
  //   if (
  //     typeof client.ws !== "undefined" &&
  //     typeof client.ws.isAlive !== "undefined"
  //   ) {
  //     if (
  //       client.ws.instance.readyState !== 0 &&
  //       client.ws.instance.readyState !== 2 &&
  //       client.ws.instance.readyState !== 3
  //     ) {
  //       PrinterTicker.addIssue(
  //         new Date(),
  //         farmPrinters[client.ws.index].printerURL,
  //         "Sending ping message to websocket...",
  //         "Active",
  //         farmPrinters[client.ws.index]._id
  //       );
  //       if (client.ws.isAlive === false) return client.ws.instance.terminate();
  //
  //       // Retry connecting if failed...
  //       farmPrinters[client.ws.index].webSocket = "info";
  //       farmPrinters[client.ws.index].webSocketDescription =
  //         "Checking if Websocket is still alive";
  //       client.ws.isAlive = false;
  //       client.ws.instance.ping(noop);
  //     }
  //   }
  // });
};

const SSE_TASK = () => {
  //     const currentOperations = await PrinterClean.returnCurrentOperations();
  //     let printersInformation = await PrinterClean.listPrintersInformation();
  //     printersInformation = await filterMe(printersInformation);
  //     printersInformation = await sortMe(printersInformation);
  //     const printerControlList = await PrinterClean.returnPrinterControlList();
  //
  //     if (!!serverSettings.influxExport?.active) {
  //       if (influxCounter >= 2000) {
  //         sendToInflux(printersInformation);
  //         influxCounter = 0;
  //       } else {
  //         influxCounter = influxCounter + 500;
  //       }
  //       // eslint-disable-next-line no-use-before-define
  //     }
  //     const infoDrop = {
  //       printersInformation: printersInformation,
  //       currentOperations: currentOperations,
  //       printerControlList: printerControlList,
  //       clientSettings: clientSettings
  //     };
  //     clientInformation = await stringify(infoDrop);
  //     clients.forEach((c, index) => {
  //       c.res.write("data: " + clientInformation + "\n\n");
  //     });
};

const SSE_DASHBOARD = () => {
  // if (interval === false) {
  //   interval = setInterval(async function () {
  //     let clientsSettingsCache = await SettingsClean.returnClientSettings();
  //     if (!clientsSettingsCache) {
  //       await SettingsClean.start();
  //       clientsSettingsCache = await SettingsClean.returnClientSettings();
  //     }
  //
  //     let dashboardSettings = clientsSettingsCache.dashboard;
  //     if (!dashboardSettings) {
  //       dashboardSettings = getDefaultDashboardSettings();
  //     }
  //
  //     const currentOperations = await PrinterClean.returnCurrentOperations();
  //     const dashStatistics = await PrinterClean.returnDashboardStatistics();
  //     const printerInformation = await PrinterClean.listPrintersInformation();
  //     const infoDrop = {
  //       printerInformation,
  //       currentOperations,
  //       dashStatistics,
  //       dashboardSettings
  //     };
  //
  //     clientInformation = await stringify(infoDrop);
  //     for (clientId in clients) {
  //       clients[clientId].write("retry:" + 10000 + "\n");
  //       clients[clientId].write("data: " + clientInformation + "\n\n"); // <- Push a message to a single attached client
  //     }
  //   }, 5000);
  // }
};

const STATE_TRACK_COUNTERS = async () => {
  await Runner.trackCounters();
};

// TODO we'll have to pool this with a network, event-loop or CPU budget in mind
const STATE_SETUP_WEBSOCKETS = async () => {
  // for (let i = 0; i < farmPrinters.length; i++) {
  //   // Make sure runners are created ready for each printer to pass between...
  //   await Runner.setupWebSocket(farmPrinters[i]._id);
  //   PrinterClean.generate(farmPrinters[i], systemSettings.filamentManager);
  // }
  // FilamentClean.start(systemSettings.filamentManager);
};

const STATE_PRINTER_GENERATE_TASK = async () => {
  // for (let index = 0; index < farmPrinters.length; index++) {
  //   if (typeof farmPrinters[index] !== "undefined") {
  //     PrinterClean.generate(farmPrinters[index], systemSettings.filamentManager);
  //   }
  // }
};

const DATABASE_MIGRATIONS_TASK = async () => {
  // const migrations = require("./migrations");
  // console.log(migrations);
};

/**
 * See an overview of this pattern/structure here https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * @param task
 * @param preset
 * @param milliseconds optional parameter to quickly set milliseconds timing
 * @returns {{task, id, preset}}
 */
function KsatLlorKcir(task, preset, milliseconds = 0) {
  preset.milliseconds = preset.milliseconds || milliseconds;
  return {
    id: task.name || task,
    task,
    preset
  };
}

class OctoFarmTasks {
  static BOOT_TASKS = [
    KsatLlorKcir("printerSseTask", TaskPresets.PERIODIC, 500),
    KsatLlorKcir("printerInfoTask", TaskPresets.PERIODIC_2500MS)
    // KsatLlorKcir(DATABASE_MIGRATIONS_TASK, TaskPresets.RUNONCE),
    // KsatLlorKcir(STATE_SETUP_WEBSOCKETS, TaskPresets.RUNDELAYED, 5000),
    // KsatLlorKcir(STATE_PRINTER_GENERATE_TASK, TaskPresets.RUNDELAYED, 10000)
    // KsatLlorKcir(STATE_PRINTER_GENERATE_TASK, TaskPresets.PERIODIC, 20000),
    // KsatLlorKcir(HISTORY_CACHE_TASK, TaskPresets.RUNONCE),
    // KsatLlorKcir(FILAMENT_CLEAN_TASK, TaskPresets.RUNONCE),
    // KsatLlorKcir(GITHUB_UPDATE_CHECK_TASK, TaskPresets.RUNDELAYED, 1000),
    // KsatLlorKcir(STATE_TRACK_COUNTERS, TaskPresets.PERIODIC, 30000)
  ];
}

module.exports = {
  OctoFarmTasks
};
