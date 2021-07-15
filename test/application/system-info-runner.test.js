const { SystemRunner } = require("../../server_src/state/system-info.store");

const diskFormats = ["NTFS", "exFAT", "ext4", "ext3", "ext2", "FAT32", "FAT16", "FAT8", "FAT"];

function clientCPUCalc(systemInfo) {
  const currentProc = systemInfo?.currentProcess;
  const cpuLoad = systemInfo?.cpuLoad;
  if (!!cpuLoad?.currentLoadSystem && !!cpuLoad?.currentLoadUser) {
    const systemLoad = cpuLoad.currentLoadSystem;
    const userLoad = cpuLoad.currentLoadUser;
    const octoLoad = !!currentProc?.cpuu ? currentProc.cpuu : 0;
    const remain = systemLoad + octoLoad + userLoad;

    // labels: ['System', 'OctoFarm', 'User', 'Free'],
    return [systemLoad, octoLoad, userLoad, 100 - remain];
  }
}

function clientMemCalc(systemInfo) {
  const currentProc = systemInfo?.currentProcess;
  const memoryInfo = systemInfo?.memoryInfo;
  if (!!memoryInfo) {
    const systemUsedRAM = memoryInfo.used;
    const freeRAM = memoryInfo.free;

    if (!!(currentProc?.memRss || currentProc?.mem)) {
      let octoFarmRAM = currentProc?.memRss * 1000;
      if (!currentProc.memRss || Number.isNaN(octoFarmRAM)) {
        octoFarmRAM = (memoryInfo.total / 100) * currentProc?.mem;
      }

      if (Number.isNaN(octoFarmRAM)) {
        // labels: ['System', 'OctoFarm', 'Free'],
        return [systemUsedRAM, 0, freeRAM];
      } else {
        return [systemUsedRAM, octoFarmRAM, freeRAM];
      }
    } else {
      return [systemUsedRAM, 0, freeRAM];
    }
  } else {
    return [0, 0, 0];
  }
}

describe("SystemRunner", () => {
  /**
   * Tests that valid system information is passed from the SystemRunner
   */
  it("should return valid system information with memory correctly calculated", async () => {
    const systemInfo = await SystemRunner.querySystemInfo();

    // Mimic client validation
    expect(systemInfo).toBeTruthy();
    expect(Object.keys(systemInfo).length).toBeGreaterThan(0);

    // Assert client used props
    expect(systemInfo.cpuLoad.currentLoadSystem).toEqual(expect.any(Number)); // Used by client
    expect(systemInfo.cpuLoad.currentLoadSystem).toBeGreaterThan(0);
    expect(systemInfo.currentProcess.cpuu).toEqual(expect.any(Number));
    expect(systemInfo.currentProcess.cpuu).toBeGreaterThan(0);
    expect(systemInfo.cpuLoad.currentLoadUser).toEqual(expect.any(Number));
    expect(systemInfo.cpuLoad.currentLoadUser).toBeGreaterThan(0);
    expect(systemInfo.memoryInfo.total).toBeTruthy();
    expect(systemInfo.memoryInfo.free).toBeTruthy();
    if (!systemInfo.currentProcess.memRss) {
      expect(systemInfo.currentProcess.mem).toBeTruthy();
    } else {
      // Rss is useful
      expect(systemInfo.currentProcess.memRss).toBeTruthy();
      expect(systemInfo.currentProcess.memVsz).toBeTruthy(); // Not actually needed, but nice to know
    }

    // Assert client calculations
    const arrayData = clientCPUCalc(systemInfo);
    expect(arrayData[0]).toBeGreaterThan(0);
    expect(arrayData[1]).toBeGreaterThan(0);
    expect(arrayData[2]).toBeGreaterThan(0);
    expect(arrayData[3]).not.toBeNaN();

    const memArrayData = clientMemCalc(systemInfo);

    expect(memArrayData[0]).toBeGreaterThan(0);
    expect(memArrayData[1]).not.toBeNaN();
    expect(memArrayData[1]).toBeGreaterThan(1e6);
    expect(memArrayData[1]).toBeLessThan(1100e6);
    expect(memArrayData[2]).toBeGreaterThan(0);

    // Assert random other properties
    expect(systemInfo.cpuLoad.currentLoad).toEqual(expect.any(Number));
    expect(systemInfo.cpuLoad.currentLoadIdle).toEqual(expect.any(Number));
    expect(systemInfo.memoryInfo.total).toEqual(expect.any(Number));
    expect(systemInfo.memoryInfo.free).toBeGreaterThan(100000000); // 1GB
    expect(systemInfo.sysUptime.uptime).toBeGreaterThan(50); // s uptime
    expect(systemInfo.sysUptime.current).toBeGreaterThan(1617880660070); // ms time as of writing this test ^^
    expect(systemInfo.sysUptime.timezone).toBeTruthy();
    expect(systemInfo.processUptime).toEqual(expect.any(Number));
    expect(systemInfo.currentProcess.pid).toBeGreaterThan(1);
    expect(systemInfo.currentProcess.name).toEqual(expect.any(String));

    expect(diskFormats).toContain(systemInfo.systemDisk.type);
    expect(systemInfo.warnings).toBeTruthy();
  }, 7000);
});
