const softwareUpdateChecker = require("./services/octofarm-update.service");
const { Runner } = require("./runners/state");
const { FilamentClean } = require("./lib/dataFunctions/filamentClean");
const { initHistoryCache } = require("./cache/history.cache");
const { TaskPresets } = require("./task.presets");
const { PrinterClean } = require("./lib/dataFunctions/printerClean");

const PRINTER_CLEAN_TASK = async () => {
  const serverSettings = require("./settings/serverSettings");
  const printersInformation = PrinterClean.listPrintersInformation();
  await PrinterClean.sortCurrentOperations(printersInformation);

  await PrinterClean.statisticsStart();
  await PrinterClean.createPrinterList(
    printersInformation,
    serverSettings.filamentManager
  );
};

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


const STATE_TRACK_COUNTERS = async () => {
  await Runner.trackCounters();
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
    id: task.name,
    task,
    preset
  };
}

class OctoFarmTasks {
  static BOOT_TASKS = [
    KsatLlorKcir(PRINTER_CLEAN_TASK, TaskPresets.PERIODIC_2500MS),
    KsatLlorKcir(HISTORY_CACHE_TASK, TaskPresets.RUNONCE),
    KsatLlorKcir(FILAMENT_CLEAN_TASK, TaskPresets.RUNONCE),
    KsatLlorKcir(GITHUB_UPDATE_CHECK_TASK, TaskPresets.RUNDELAYED, 1000),
    KsatLlorKcir(STATE_TRACK_COUNTERS, TaskPresets.PERIODIC, 30000)
  ];
}

module.exports = {
  OctoFarmTasks
};
