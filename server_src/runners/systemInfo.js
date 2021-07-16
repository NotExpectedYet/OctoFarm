const si = require("systeminformation");
const os = require("os");
const process = require("process");
const Logger = require("../lib/logger.js");
const { bench } = require("../utils/benchmark.util");
const logger = new Logger("OctoFarm-Server");

const diskVeryFullWarning =
  "Warning your disk is getting full... Please clean up some space or move to a larger hard drive.";
const diskAlmostFullWarning =
  "Warning your disk is over 95% full... Please clean up some space or move to a larger hard drive.";
const diskRisk =
  "Danger! Your disk is over 99% full... OctoFarms operations could be effected if you don't clean up some space or move to a larger hard drive.";
let systemInfo = {};

const queryRunner = {
  cpuCurrentSpeed: si.cpuCurrentSpeed,
  cpuLoad: si.currentLoad,
  memoryInfo: si.mem,
  sysUptime: si.time,
  processUptime: process.uptime,
  fileSize: si.fsSize // Converted to system disk and warnings later
};

class SystemRunner {
  static returnInfo() {
    return systemInfo;
  }

  /**
   * Query the systemInfo with an updated values for currentProcess
   * @returns {Promise<{}>}
   */
  static async queryWithFreshCurrentProcess() {
    let currentProcess;

    const systemProcesses = await bench(si.processes);
    // // Find our process and assign it
    systemProcesses.list.forEach((systemProcess) => {
      if (systemProcess.pid === process.pid) {
        currentProcess = systemProcess;
      }
    });

    systemInfo.currentProcess = currentProcess;

    return this.returnInfo();
  }

  static async queryStaticBench() {
    const benchResults = {};
    const queryResults = {};
    for (const [key, query] of Object.entries(queryRunner)) {
      const benchmarkReport = await bench(query, true);
      benchResults[key] = benchmarkReport.time;
      queryResults[key] = benchmarkReport.result;
    }

    return {
      benchResults,
      queryResults
    };
  }

  static getDiskWarnings(disk) {
    if (!disk) {
      return {};
    }

    if (disk.use >= 99) {
      return {
        status: "danger",
        message: diskRisk
      };
    } else if (disk.use >= 95) {
      return {
        status: "warning",
        message: diskAlmostFullWarning
      };
    } else if (disk.use >= 90) {
      return {
        status: "warning",
        message: diskVeryFullWarning
      };
    }
    return {};
  }

  /**
   * Call and collect quite heavy system information queries
   * @returns {Promise<boolean|{sysUptime: *, currentProcess: {}, cpuLoad: any, memoryInfo: any, osInfo: any, systemDisk, warnings: {}, processUptime: number, cpuInfo: {cpu: any, speed: any}}>}
   */
  static async querySystemInfo() {
    try {
      await this.queryWithFreshCurrentProcess();
      const { benchResults, queryResults } = await this.queryStaticBench();

      //This maybe related to node 13.12.0 possibly. Issue #341.
      const systemDisk = queryResults.fileSize[0];
      let warnings = this.getDiskWarnings(systemDisk);

      systemInfo = {
        cpuCurrentSpeed: queryResults.cpuCurrentSpeed,
        cpuLoad: queryResults.cpuLoad,
        memoryInfo: queryResults.memoryInfo,
        sysUptime: queryResults.sysUptime,
        processUptime: queryResults.processUptime,
        // Custom data
        warnings,
        osInfo: {
          arch: process.arch,
          distro: `${os.type()} ${os.release()} (${os.platform()})`
        },
        systemDisk,
        currentProcess: systemInfo.currentProcess,
        benchmarkTimes: benchResults
      };

      return systemInfo;
    } catch (e) {
      logger.error(
        "Some system information has failed to generate:",
        e.message
      );

      return false;
    }
  }
}

// BENCHMARK BOTTLENECKS
// API query
// === Uptime
// ✓ sysUptime?.uptime
// ✓ processUptime
// === CPU chart
// ... just accepted it 300ms is ok-ish X currentProc?.cpuu ==> octoLoad
// ✓ cpuLoad?.currentLoadSystem ==> systemLoad
// ✓ cpuLoad?.currentLoadUser ==> userLoad
// === Memory chart
// ✓ memoryInfo.used ==> systemUsedRAM
// ✓ memoryInfo.free ==> freeRAM
// ... just accepted it 300ms is ok-ish X currentProc?.memRss || currentProc?.mem ==> octoFarmRAM

// View
// ✓ warnings.status
// ✓ warnings.message
// ✓ isPm2
// ✓ isNodemon
// ✓ sysUptime.uptime
// ✓✓✓ X osInfo.distro
// ✓✓✓ X osInfo.arch
// ✓ cpuCurrentSpeed.cores.forEach (cpuCurrentSpeed, cpuSpeed)
// ✓ memoryInfo.total
// === 90 - 93ms
// ✓ systemDisk.mount
// ✓ systemDisk.fs
// ✓ systemDisk.used
// ✓ systemDisk.size
// ✓ systemDisk.use.toFixed(2)

// ✓ processUptime
//  ? update?.current_version
//  ? update?.latestReleaseKnown
//  ? update?.current_version
//  ? update?.latestReleaseKnown.html_url
//  ? update?.latestReleaseKnown.name
//  ? update?.latestReleaseKnown.tag_name
// ✓ sysUptime.timezoneName
// ✓ sysUptime.timezone
// ... just accepted it 300ms is ok-ish X currentProcess?.command

module.exports = {
  SystemRunner
};
