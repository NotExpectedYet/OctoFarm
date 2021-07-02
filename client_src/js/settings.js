import OctoFarmClient from "./lib/octofarm_client.js";
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import Script from "./lib/modules/scriptCheck.js";
import OctoPrintClient from "./lib/octoprint";
import FileOperations from "./lib/functions/file.js";
import {
  setupFilamentManagerSyncBtn,
  setupFilamentManagerReSyncBtn,
  setupFilamentManagerDisableBtn,
  isFilamentManagerPluginSyncEnabled
} from "./lib/modules/filamentManagerPlugin";

import ApexCharts from "apexcharts";
// Add listeners to settings
document.getElementById("saveServerSettings").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.update();
});
document.getElementById("saveSettings").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ClientSettings.update();
});
document.getElementById("nukeEverything").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases();
});
document.getElementById("nukeAlerts").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("AlertsDB");
});
document.getElementById("nukeClientSettings").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("ClientSettingsDB");
});
document.getElementById("nukeFilament").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("FilamentDB");
});
document.getElementById("nukeHistory").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("HistoryDB");
});
document.getElementById("nukePrinters").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("PrinterDB");
});
document.getElementById("nukeRoomData").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("roomDataDB");
});
document.getElementById("nukeServerSettings").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("ServerSettings");
});
document.getElementById("nukeUsers").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.nukeDatabases("UserDB");
});
document.getElementById("restartOctoFarmBtn").addEventListener("click", (e) => {
  ServerSettings.serviceRestart();
});
document.getElementById("updateOctoFarmBtn").addEventListener("click", (e) => {
  ServerSettings.updateOctoFarmCommand(false);
});
document
  .getElementById("checkUpdatesForOctoFarmBtn")
  .addEventListener("click", (e) => {
    ServerSettings.checkForOctoFarmUpdates();
  });

document.getElementById("exportAlerts").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.exportDatabases("AlertsDB");
});
document
  .getElementById("exportClientSettings")
  .addEventListener("click", (e) => {
    // Validate Printer Form, then Add
    ServerSettings.exportDatabases("ClientSettingsDB");
  });
document.getElementById("exportFilament").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.exportDatabases("FilamentDB");
});
document.getElementById("exportHistory").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.exportDatabases("HistoryDB");
});
document.getElementById("exportPrinters").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.exportDatabases("PrinterDB");
});
document.getElementById("exportRoomData").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.exportDatabases("roomDataDB");
});
document
  .getElementById("exportServerSettings")
  .addEventListener("click", (e) => {
    // Validate Printer Form, then Add
    ServerSettings.exportDatabases("ServerSettings");
  });
document.getElementById("exportUsers").addEventListener("click", (e) => {
  // Validate Printer Form, then Add
  ServerSettings.exportDatabases("UserDB");
});

document
  .getElementById("setupTimelapseOctoPrint")
  .addEventListener("click", async (e) => {
    await setupOctoPrintClientsforTimelapse();
  });

document
  .getElementById("logDumpGenerateBtn")
  .addEventListener("click", async (e) => {
    await ServerSettings.generateLogFileDump();
  });

async function setupOctoPrintClientsforTimelapse() {
  try {
    const printers = await OctoFarmClient.post("printers/printerInfo");
    bootbox.confirm({
      title: "Are you sure?",
      message:
        // eslint-disable-next-line max-len
        "If you press yes below your timelapse settings will automatically be updated to work with OctoFarms setup. The script will update any online instances and there shouldn't be a restart necassary. It does however presume you have your ffmpeg path setup with your snapshot URL inputted into OctoPrint.",
      buttons: {
        confirm: {
          label: "Yes",
          className: "btn-success"
        },
        cancel: {
          label: "No",
          className: "btn-danger"
        }
      },
      callback: async function (result) {
        if (result) {
          let settings = {
            webcam: {
              ffmpegVideoCodec: "libx264",
              webcamEnabled: true
            }
          };
          let timelapse = {
            type: "zchange"
          };
          for (let i = 0; i < printers.length; i++) {
            if (printers[i].printerState.colour.category !== "Offline") {
              let sett = await OctoPrintClient.post(
                printers[i],
                "settings",
                settings
              );
              if (sett.status === 200) {
                UI.createAlert(
                  "success",
                  printers[i].printerName +
                    ": Updated your web camera settings!",
                  1000,
                  "Clicked"
                );
              } else {
                UI.createAlert(
                  "danger",
                  printers[i].printerName + ": Failed to update the settings!",
                  1000,
                  "Clicked"
                );
              }
              let time = await OctoPrintClient.post(
                printers[i],
                "timelapse",
                timelapse
              );
              if (time.status === 200) {
                UI.createAlert(
                  "success",
                  printers[i].printerName +
                    ": Updated your timelapse settings!",
                  1000,
                  "Clicked"
                );
              } else {
                UI.createAlert(
                  "danger",
                  printers[i].printerName + ": Failed to timelapse settings!",
                  1000,
                  "Clicked"
                );
              }
            } else {
              //Printer offline skipping...
            }
          }
        }
      }
    });
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      "There was an issue setting up clients for time lapse",
      3000,
      "clicked"
    );
  }
}

document.getElementById("resetDashboardBtn").addEventListener("click", (e) => {
  const dashData = localStorage.getItem("dashboardConfiguration");
  const serializedData = JSON.parse(dashData);
  if (serializedData !== null && serializedData.length !== 0) {
    localStorage.removeItem("dashboardConfiguration");
  }
  UI.createAlert(
    "success",
    "Dashboard data cleared from browser",
    3000,
    "clicked"
  );
});

let oldServerSettings = {};

const optionsMemory = {
  title: {
    text: "",
    align: "center",
    margin: 1,
    offsetX: 0,
    offsetY: 0,
    floating: false,
    style: {
      fontSize: "14px",
      fontWeight: "bold",
      fontFamily: undefined,
      color: "#fff"
    }
  },
  chart: {
    type: "donut",
    height: "300px",
    animations: {
      enabled: false
    },
    background: "#303030"
  },
  theme: {
    mode: "dark"
  },
  plotOptions: {
    pie: {
      expandOnClick: true,
      dataLabels: {
        offset: 10,
        minAngleToShowLabel: 15
      }
    }
  },
  stroke: {
    show: false
  },
  tooltip: {
    y: {
      formatter(val) {
        return Calc.bytes(val);
      }
    }
  },
  noData: {
    text: "Loading..."
  },
  dataLabels: {
    enabled: false
  },
  series: [],
  labels: ["Other", "OctoFarm", "Free"],
  colors: ["#f39c12", "#3498db", "#00bc8c"],
  legend: {
    show: true,
    showForSingleSeries: false,
    showForNullSeries: true,
    showForZeroSeries: true,
    position: "bottom",
    horizontalAlign: "center",
    floating: false,
    fontSize: "11px",
    fontFamily: "Helvetica, Arial",
    fontWeight: 400,
    formatter: undefined,
    inverseOrder: false,
    width: undefined,
    height: undefined,
    tooltipHoverFormatter: undefined,
    offsetX: -25,
    offsetY: 0,
    labels: {
      colors: undefined,
      useSeriesColors: false
    },
    markers: {
      width: 9,
      height: 9,
      strokeWidth: 0,
      strokeColor: "#fff",
      fillColors: undefined,
      radius: 1,
      customHTML: undefined,
      onClick: undefined,
      offsetX: 0,
      offsetY: 0
    },
    itemMargin: {
      horizontal: 1,
      vertical: 0
    },
    onItemClick: {
      toggleDataSeries: false
    },
    onItemHover: {
      highlightDataSeries: false
    }
  }
};
const optionsCPU = {
  title: {
    text: "",
    align: "center",
    margin: 1,
    offsetX: 0,
    offsetY: 0,
    floating: false,
    style: {
      fontSize: "14px",
      fontWeight: "bold",
      fontFamily: undefined,
      color: "#fff"
    }
  },
  chart: {
    type: "donut",
    height: "300px",
    animations: {
      enabled: true
    },
    background: "#303030"
  },
  theme: {
    mode: "dark"
  },
  plotOptions: {
    pie: {
      expandOnClick: false,
      dataLabels: {
        offset: 10,
        minAngleToShowLabel: 15
      }
    }
  },
  stroke: {
    show: false
  },
  tooltip: {
    y: {
      formatter(val) {
        return `${Math.round(val * 10) / 10}%`;
      }
    }
  },
  noData: {
    text: "Loading..."
  },
  dataLabels: {
    enabled: false
  },
  series: [],
  labels: ["System", "OctoFarm", "User", "Free"],
  colors: ["#f39c12", "#3498db", "#375a7f", "#00bc8c"],
  legend: {
    show: true,
    showForSingleSeries: false,
    showForNullSeries: true,
    showForZeroSeries: true,
    position: "bottom",
    horizontalAlign: "center",
    floating: false,
    fontSize: "11px",
    fontFamily: "Helvetica, Arial",
    fontWeight: 400,
    formatter: undefined,
    inverseOrder: false,
    width: undefined,
    height: undefined,
    tooltipHoverFormatter: undefined,
    offsetX: -25,
    offsetY: 0,
    labels: {
      colors: undefined,
      useSeriesColors: false
    },
    markers: {
      width: 9,
      height: 9,
      strokeWidth: 0,
      strokeColor: "#fff",
      fillColors: undefined,
      radius: 1,
      customHTML: undefined,
      onClick: undefined,
      offsetX: 0,
      offsetY: 0
    },
    itemMargin: {
      horizontal: 1,
      vertical: 0
    },
    onItemClick: {
      toggleDataSeries: false
    },
    onItemHover: {
      highlightDataSeries: false
    }
  }
};
const systemChartCPU = new ApexCharts(
  document.querySelector("#systemChartCPU"),
  optionsCPU
);
systemChartCPU.render();
const systemChartMemory = new ApexCharts(
  document.querySelector("#systemChartMemory"),
  optionsMemory
);
systemChartMemory.render();
setInterval(async function updateStatus() {
  try {
    const systemInfo = await OctoFarmClient.get("system/info");
    const sysUptimeElem = document.getElementById("systemUptime");
    const procUptimeElem = document.getElementById("processUpdate");

    if (systemInfo.sysUptime?.uptime && !!sysUptimeElem) {
      sysUptimeElem.innerHTML = Calc.generateTime(systemInfo.sysUptime.uptime);
    }

    if (systemInfo.processUptime && !!sysUptimeElem) {
      procUptimeElem.innerHTML = Calc.generateTime(systemInfo.processUptime);
    }

    const currentProc = systemInfo?.currentProcess;
    const cpuLoad = systemInfo?.cpuLoad;
    if (!!cpuLoad?.currentLoadSystem && !!cpuLoad?.currentLoadUser) {
      const systemLoad = cpuLoad.currentLoadSystem;
      const userLoad = cpuLoad.currentLoadUser;
      const octoLoad = !!currentProc?.cpuu ? currentProc.cpuu : 0;
      const remain = systemLoad + octoLoad + userLoad;

      // labels: ['System', 'OctoFarm', 'User', 'Free'],
      systemChartCPU.updateSeries([
        systemLoad,
        octoLoad,
        userLoad,
        100 - remain
      ]);
    }

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
          systemChartMemory.updateSeries([systemUsedRAM, 0, freeRAM]);
        } else {
          systemChartMemory.updateSeries([systemUsedRAM, octoFarmRAM, freeRAM]);
        }
      } else {
        systemChartMemory.updateSeries([systemUsedRAM, 0, freeRAM]);
      }
    } else {
      systemChartMemory.updateSeries([0, 0, 0]);
    }
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      "There was an issue with getting system information"
    );
  }
}, 5000);

class ClientSettings {
  static async init() {
    try {
      const clientSettings = await OctoFarmClient.get("settings/client/get");
      //// localStorage.setItem("clientSettings", JSON.stringify(res));
      document.getElementById("panelCurrentOpOn").checked =
        clientSettings.panelView.currentOp;
      document.getElementById("panelHideOffline").checked =
        clientSettings.panelView.hideOff;
      document.getElementById("panelHideClosed").checked =
        clientSettings.panelView.hideClosed;
      // document.getElementById("panelHideIdle").checked =
      //   res.panelView.hideIdle;
      if (clientSettings.panelView.printerRows) {
        document.getElementById("selectCameraGrid").value =
          clientSettings.panelView.printerRows;
      } else {
        document.getElementById("selectCameraGrid").value = 2;
      }

      if (clientSettings.dashboard) {
        document.getElementById("currentOperations").checked =
          clientSettings.dashboard.farmActivity.currentOperations;
        document.getElementById("cumulativeTimes").checked =
          clientSettings.dashboard.farmActivity.cumulativeTimes;
        document.getElementById("averageTimes").checked =
          clientSettings.dashboard.farmActivity.averageTimes;

        document.getElementById("printerState").checked =
          clientSettings.dashboard.printerStates.printerState;
        document.getElementById("printerTemps").checked =
          clientSettings.dashboard.printerStates.printerProgress;
        document.getElementById("printerUtilisation").checked =
          clientSettings.dashboard.printerStates.printerUtilisation;
        document.getElementById("printerProgress").checked =
          clientSettings.dashboard.printerStates.printerProgress;
        document.getElementById("currentStatus").checked =
          clientSettings.dashboard.printerStates.currentStatus;

        document.getElementById("currentUtilisation").checked =
          clientSettings.dashboard.farmUtilisation.currentUtilisation;
        document.getElementById("farmUtilisation").checked =
          clientSettings.dashboard.farmUtilisation.farmUtilisation;

        document.getElementById("weeklyUtilisation").checked =
          clientSettings.dashboard.historical.weeklyUtilisation;
        document.getElementById("hourlyTotalTemperatures").checked =
          clientSettings.dashboard.historical.hourlyTotalTemperatures;
        document.getElementById("environmentalHistory").checked =
          clientSettings.dashboard.historical.environmentalHistory;
        document.getElementById("filamentUsageCheck").checked =
          clientSettings.dashboard.historical.filamentUsageByDay;
        document.getElementById("printCompletionCheck").checked =
          clientSettings.dashboard.historical.historyCompletionByDay;
        document.getElementById("filamentUsageOverTimeCheck").checked =
          clientSettings.dashboard.historical.filamentUsageOverTime;
      }

      if (clientSettings.controlSettings) {
        document.getElementById("printerControlFilesFirst").checked =
          clientSettings.controlSettings.filesTop;
      }
    } catch (e) {
      console.error(e);
      UI.createAlert(
        "error",
        "There was an issue with getting your client settings",
        3000,
        "clicked"
      );
    }
  }

  static async update() {
    const opts = {
      panelView: {
        currentOp: document.getElementById("panelCurrentOpOn").checked,
        hideOff: document.getElementById("panelHideOffline").checked,
        hideClosed: document.getElementById("panelHideClosed").checked
        // hideIdle: document.getElementById("panelHideIdle").checked,
      },
      cameraView: {
        cameraRows: document.getElementById("selectCameraGrid").value
      },
      controlSettings: {
        filesTop: document.getElementById("printerControlFilesFirst").checked
      },
      dashboard: {
        defaultLayout: [
          { x: 0, y: 0, width: 2, height: 5, id: "currentUtil" },
          { x: 5, y: 0, width: 3, height: 5, id: "farmUtil" },
          { x: 8, y: 0, width: 2, height: 5, id: "averageTimes" },
          { x: 10, y: 0, width: 2, height: 5, id: "cumulativeTimes" },
          { x: 2, y: 0, width: 3, height: 5, id: "currentStat" },
          { x: 6, y: 5, width: 3, height: 5, id: "printerTemps" },
          { x: 9, y: 5, width: 3, height: 5, id: "printerUtilisation" },
          { x: 0, y: 5, width: 3, height: 5, id: "printerStatus" },
          { x: 3, y: 5, width: 3, height: 5, id: "printerProgress" },
          { x: 6, y: 10, width: 6, height: 9, id: "hourlyTemper" },
          { x: 0, y: 10, width: 6, height: 9, id: "weeklyUtil" },
          { x: 0, y: 19, width: 12, height: 8, id: "enviroData" },
          {
            x: 0,
            y: 19,
            width: 12,
            height: 8,
            id: "filamentUsageOverTime"
          },
          { x: 0, y: 19, width: 12, height: 8, id: "filamentUsageByDay" },
          {
            x: 0,
            y: 19,
            width: 12,
            height: 8,
            id: "historyCompletionByDay"
          }
        ],
        savedLayout: localStorage.getItem("dashboardConfiguration"),
        farmActivity: {
          currentOperations:
            document.getElementById("currentOperations").checked,
          cumulativeTimes: document.getElementById("cumulativeTimes").checked,
          averageTimes: document.getElementById("averageTimes").checked
        },
        printerStates: {
          printerState: document.getElementById("printerState").checked,
          printerTemps: document.getElementById("printerTemps").checked,
          printerUtilisation:
            document.getElementById("printerUtilisation").checked,
          printerProgress: document.getElementById("printerProgress").checked,
          currentStatus: document.getElementById("currentStatus").checked
        },
        farmUtilisation: {
          currentUtilisation:
            document.getElementById("currentUtilisation").checked,
          farmUtilisation: document.getElementById("farmUtilisation").checked
        },
        historical: {
          weeklyUtilisation:
            document.getElementById("weeklyUtilisation").checked,
          hourlyTotalTemperatures: document.getElementById(
            "hourlyTotalTemperatures"
          ).checked,
          environmentalHistory: document.getElementById("environmentalHistory")
            .checked,
          historyCompletionByDay: document.getElementById(
            "printCompletionCheck"
          ).checked,
          filamentUsageByDay:
            document.getElementById("filamentUsageCheck").checked,
          filamentUsageOverTime: document.getElementById(
            "filamentUsageOverTimeCheck"
          ).checked
        }
      }
    };
    try {
      await OctoFarmClient.post("settings/client/update", opts);
      UI.createAlert("success", "Client settings updated", 3000, "clicked");
    } catch (e) {
      console.error(e);
      UI.createAlert(
        "error",
        "Failed to update client settings...",
        3000,
        "clicked"
      );
    }
    //localStorage.setItem("clientSettings", JSON.stringify(opts));
  }
}

class ServerSettings {
  static async nukeDatabases(database) {
    try {
      let databaseNuke;
      if (!database) {
        databaseNuke = await OctoFarmClient.delete("system/databases");
      } else {
        databaseNuke = await OctoFarmClient.delete(
          "system/database/" + database
        );
      }
      UI.createAlert("success", databaseNuke.message, 3000);
    } catch (e) {
      console.error(e);
      UI.createAlert(
        "error",
        "There was an issue with the tactical nuke!",
        3000,
        "clicked"
      );
    }
  }

  static async exportDatabases(database) {
    try {
      const databaseExport = await OctoFarmClient.get(
        "system/database/" + database
      );
      if (databaseExport?.databases[0].length !== 0) {
        FileOperations.download(
          database + ".json",
          JSON.stringify(databaseExport.databases)
        );
      } else {
        UI.createAlert(
          "warning",
          "Database is empty, will not export...",
          3000,
          "clicked"
        );
      }
    } catch (e) {
      console.error(e);
      UI.createAlert(
        "error",
        "Database could not be contacted",
        3000,
        "clicked"
      );
    }
  }

  static async init() {
    if (await isFilamentManagerPluginSyncEnabled()) {
      setupFilamentManagerReSyncBtn();
      setupFilamentManagerDisableBtn();
    } else {
      setupFilamentManagerSyncBtn();
    }

    await ServerSettings.enableOctoFarmLogsList();
  }
  static async enableOctoFarmLogsList() {
    try {
      let logList = await OctoFarmClient.get("system/logs");
      const logTable = document.getElementById("serverLogs");
      logList.forEach((logs) => {
        logTable.insertAdjacentHTML(
          "beforeend",
          `
            <tr>
                <td>${logs.name}</td>
                <td>${new Date(logs.modified).toString().substring(0, 21)}</td>
                <td>${Calc.bytes(logs.size)}</td>
                <td><button id="${
                  logs.name
                }" type="button" class="btn btn-sm btn-primary"><i class="fas fa-download"></i></button></td>
            </tr>
        `
        );
        document
          .getElementById(logs.name)
          .addEventListener("click", async (event) => {
            window.open(`/system/log/${logs.name}`);
          });
      });
    } catch (e) {
      console.error(e);
      UI.createAlert(
        "error",
        "There was an issue updating the logs table",
        3000
      );
    }
  }

  static async serviceRestart() {
    let systemRestartBtn = document.getElementById("restartOctoFarmBtn");
    // Make sure the system button is disabled whilst the restart is happening.
    if (systemRestartBtn) {
      systemRestartBtn.disabled = true;
    }
    try {
      await OctoFarmClient.post("system/restart");
      UI.createAlert(
        "success",
        "System restart command was successful, the server will restart in 5 seconds...",
        5000,
        "clicked"
      );
    } catch (e) {
      console.error(e);
      UI.createAlert(
        "error",
        "System restart command failed... This will not work unless pm2 is monitoring OctoFarm as detailed in the instructions: <a href='https://octofarm.net/installation' target='_blank'>Click Here</a>",
        0,
        "clicked"
      );
    } finally {
      setTimeout(() => {
        if (systemRestartBtn) {
          systemRestartBtn.disabled = false;
        }
      }, 5000);
    }
  }

  static async updateOctoFarmCommand(doWeForcePull, doWeInstallPackages) {
    let updateOctoFarmBtn = document.getElementById("updateOctoFarmBtn");
    // Make sure the update OctoFarm button is disabled after keypress
    if (updateOctoFarmBtn) {
      updateOctoFarmBtn.disabled = true;
      UI.addLoaderToElementsInnerHTML(updateOctoFarmBtn);
    }
    let updateData = {
      forcePull: false,
      doWeInstallPackages: false
    };
    if (doWeForcePull) {
      updateData.forcePull = true;
    }
    if (doWeInstallPackages) {
      updateData.doWeInstallPackages = true;
    }
    try {
      let updateOctoFarm = await OctoFarmClient.post(
        "system/update",
        updateData
      );
      //Make sure response from server is received, and make sure the status is 200
      if (updateOctoFarm && updateOctoFarm.status !== 200) {
        // This alert is pretty mute as the serverAliveCheck will notify before...
        UI.createAlert(
          "error",
          "Server could not be contacted... is it online?",
          5000
        );
        if (updateOctoFarmBtn) {
          updateOctoFarmBtn.innerHTML =
            "<i class=\"fas fa-thumbs-up\"></i> Update OctoFarm";
          updateOctoFarmBtn.disabled = false;
        }
        return;
      }
      updateOctoFarm = await updateOctoFarm.json();

      // Local changes are detected, question whether we overwrite or cancel..
      if (
        updateOctoFarm.message.includes(
          "The update is failing due to local changes been detected."
        )
      ) {
        bootbox.confirm({
          title:
            '<span class="text-warning">Local file changes detected!</span>',
          message: updateOctoFarm?.message,
          buttons: {
            cancel: {
              className: "btn-danger",
              label: '<i class="fa fa-times"></i> Cancel'
            },
            confirm: {
              className: "btn-success",
              label: '<i class="fa fa-check"></i> Override'
            }
          },
          callback: function (result) {
            if (result) {
              ServerSettings.updateOctoFarmCommand(true);
            } else {
              if (updateOctoFarmBtn) {
                updateOctoFarmBtn.innerHTML =
                  "<i class=\"fas fa-thumbs-up\"></i> Update OctoFarm";
                updateOctoFarmBtn.disabled = false;
              }
            }
          }
        });
        return;
      }
      // Local changes are detected, question whether we overwrite or cancel..
      if (
        updateOctoFarm.message.includes(
          "You have missing dependencies that are required, Do you want to update these?"
        )
      ) {
        bootbox.confirm({
          title:
            '<span class="text-warning">Missing dependencies detected!</span>',
          message: updateOctoFarm?.message,
          buttons: {
            cancel: {
              className: "btn-danger",
              label: '<i class="fa fa-times"></i> Cancel'
            },
            confirm: {
              className: "btn-success",
              label: '<i class="fa fa-check"></i> Confirm'
            }
          },
          callback: function (result) {
            if (result) {
              ServerSettings.updateOctoFarmCommand(false, true);
            } else {
              if (updateOctoFarmBtn) {
                updateOctoFarmBtn.innerHTML =
                  '<i class="fas fa-thumbs-up"></i> Update OctoFarm';
                updateOctoFarmBtn.disabled = false;
              }
            }
          }
        });
        return;
      }

      UI.createAlert(
        `${updateOctoFarm?.statusTypeForUser}`,
        `${updateOctoFarm?.message}`,
        0,
        "clicked"
      );
      UI.removeLoaderFromElementInnerHTML(updateOctoFarmBtn);

      if (updateOctoFarm?.haveWeSuccessfullyUpdatedOctoFarm) {
        UI.createAlert(
          "success",
          "We have successfully updated... OctoFarm will restart now.",
          0,
          "Clicked"
        );
        this.serviceRestart();
      }
    } catch (e) {
      console.error(e);
      UI.createAlert(
        "error",
        "The update has failed to run, please check the logs"
      );
    }
  }
  static async checkForOctoFarmUpdates() {
    let forceCheckForUpdatesBtn = document.getElementById(
      "checkUpdatesForOctoFarmBtn"
    );
    // Make sure check button is disbaled after key press
    if (forceCheckForUpdatesBtn) {
      forceCheckForUpdatesBtn.disabled = true;
    }

    let updateCheck = await OctoFarmClient.get("system");
    //Make sure response from server is received, and make sure the status is 200
    if (updateCheck && updateCheck.status !== 200) {
      // This alert is pretty mute as the serverAliveCheck will notify before...
      UI.createAlert(
        "error",
        "Something went wrong on the server side, please check your logs.",
        0,
        "clicked"
      );
      setTimeout(() => {
        if (forceCheckForUpdatesBtn) {
          forceCheckForUpdatesBtn.disabled = false;
        }
      }, 5000);
      return;
    }
    // Made server check for update... notify user and await amialive check to produce a pop up
    updateCheck = await updateCheck.json();

    if (updateCheck?.air_gapped) {
      UI.createAlert(
        "error",
        "Your farm has no internet connection, this function requires an active connection to check for releases...",
        5000,
        "Clicked"
      );
      return;
    }
    if (updateCheck?.update_available) {
      UI.createAlert(
        "success",
        "We found a new update, please use the update button to action!",
        5000,
        "Clicked"
      );
    } else {
      UI.createAlert(
        "warning",
        "Sorry there are no new updates available!",
        5000,
        "Clicked"
      );
    }

    setTimeout(() => {
      if (forceCheckForUpdatesBtn) {
        forceCheckForUpdatesBtn.disabled = false;
      }
    }, 5000);
  }
  static update() {
    let reboot = false;
    const onlinePoll = document.getElementById("webSocketThrottle").value;
    const onlinePolling = {
      seconds: onlinePoll
    };
    const server = {
      port: parseInt(document.getElementById("serverPortNo").value),
      loginRequired: document.getElementById("requireLogin").checked,
      registration: document.getElementById("requireRegistration").checked
    };
    const timeout = {
      webSocketRetry: document.getElementById("webSocketRetry").value * 1000,
      apiTimeout: document.getElementById("APITimeout").value * 1000,
      apiRetryCutoff: document.getElementById("APIRetryTimeout").value * 1000,
      apiRetry: document.getElementById("APIRetry").value * 1000
    };
    const filament = {
      filamentCheck: document.getElementById("checkFilament").checked
    };
    const history = {
      snapshot: {
        onComplete: document.getElementById("snapOnComplete").checked,
        onFailure: document.getElementById("snapOnFailure").checked
      },
      thumbnails: {
        onComplete: document.getElementById("thumbOnComplete").checked,
        onFailure: document.getElementById("thumbOnFailure").checked
      },
      timelapse: {
        onComplete: document.getElementById("timelapseOnComplete").checked,
        onFailure: document.getElementById("timelapseOnFailure").checked,
        deleteAfter: document.getElementById("timelapseDelete").checked
      }
    };
    const influxExport = {
      active: document.getElementById("infActivateInfluxExport").checked,
      host: document.getElementById("infHostIP").value,
      port: document.getElementById("infHostPort").value,
      database: document.getElementById("infDatabase").value,
      username: document.getElementById("infUsername").value,
      password: document.getElementById("infPassword").value,
      retentionPolicy: {
        duration: document.getElementById("infDuration").value,
        replication: document.getElementById("infReplication").value,
        defaultRet: document.getElementById("infRetention").checked
      }
    };
    if (
      oldServerSettings.server.port !== server.port ||
      oldServerSettings.server.loginRequired !== server.loginRequired ||
      oldServerSettings.server.registration !== server.registration ||
      oldServerSettings.timeout.webSocketRetry !== timeout.webSocketRetry ||
      oldServerSettings.timeout.apiTimeout !== timeout.apiTimeout ||
      oldServerSettings.timeout.apiRetryCutoff !== timeout.apiRetryCutoff ||
      oldServerSettings.timeout.apiRetry !== timeout.apiRetry ||
      oldServerSettings.influxExport.active !== influxExport.active ||
      oldServerSettings.influxExport.host !== influxExport.host ||
      oldServerSettings.influxExport.port !== influxExport.port ||
      oldServerSettings.influxExport.database !== influxExport.database ||
      oldServerSettings.influxExport.username !== influxExport.username ||
      oldServerSettings.influxExport.password !== influxExport.password ||
      oldServerSettings.influxExport.retentionPolicy.duration !==
        influxExport.retentionPolicy.duration ||
      oldServerSettings.influxExport.retentionPolicy.replication !==
        influxExport.retentionPolicy.replication ||
      oldServerSettings.influxExport.retentionPolicy.defaultRet !==
        influxExport.retentionPolicy.defaultRet
    ) {
      reboot = true;
    }
    OctoFarmClient.post("system", {
      onlinePolling,
      server,
      timeout,
      filament,
      history,
      influxExport
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        UI.createAlert(`${res.status}`, `${res.msg}`, 3000, "Clicked");
        if (reboot) {
          bootbox.confirm({
            message:
              "Your settings changes require a restart, would you like to do this now?",
            buttons: {
              cancel: {
                label: '<i class="fa fa-times"></i> Cancel'
              },
              confirm: {
                label: '<i class="fa fa-check"></i> Confirm'
              }
            },
            callback(result) {
              if (result) {
                ServerSettings.serviceRestart();
              }
            }
          });
        }
      });
  }
  static async generateLogFileDump() {
    const spinner = document.getElementById("logDumpSpinner");
    if (spinner) {
      spinner.classList.remove("d-none");
    }
    let logDumpResponse = await OctoFarmClient.post(
      "system/logs/generateLogDump",
      {}
    );
    // Safely assume the spinner is done with here after response from server...
    if (spinner) {
      spinner.classList.add("d-none");
    }
    if (!logDumpResponse || logDumpResponse?.status !== 200) {
      UI.createAlert(
        "error",
        "Unable to contact server, is it online?",
        0,
        "clicked"
      );
      return;
    }

    logDumpResponse = await logDumpResponse.json();

    if (
      !logDumpResponse?.status ||
      !logDumpResponse?.msg ||
      !logDumpResponse?.zipDumpPath
    ) {
      UI.createAlert(
        "error",
        "There was an issue with the servers response, please check your logs",
        0,
        "clicked"
      );
      return;
    }

    UI.createAlert(
      logDumpResponse.status,
      logDumpResponse.msg,
      5000,
      "clicked"
    );

    // Error detected so no need to create button.
    if (logDumpResponse.status === "error") {
      return;
    }

    const logDumpDownloadBtn = document.getElementById("logDumpDownloadBtn");

    if (logDumpDownloadBtn) {
      logDumpDownloadBtn.classList.remove("d-none");
      logDumpDownloadBtn.addEventListener("click", (e) => {
        setTimeout(() => {
          logDumpDownloadBtn.classList.add("d-none");
        }, 5000);
        window.open(`/system/${logDumpResponse.zipDumpPath}`);
      });
    }
  }
}

// Initialise Settings
ServerSettings.init();
ClientSettings.init();
Script.get();
