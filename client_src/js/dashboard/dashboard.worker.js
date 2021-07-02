import currentOperations from "../lib/modules/currentOperations";
import { DashUpdate } from "./dashboard.updater";
import UI from "../lib/functions/ui";
import {dashboardOptions} from "./dashboard.options";

const workerResource = "/assets/dist/dashboard-sse.client.min.js";

// Move out to generic worker template
function handleVisibilityChange() {
  if (document.hidden) {
    if (worker !== null) {
      console.log("Screen abandoned, closing web worker...");
      worker.terminate();
      worker = null;
    }
  } else {
    if (worker === null) {
      console.log("Screen resumed... opening web worker...");
      createWebWorker();
    }
  }
}

function createWebWorker() {
  worker = new Worker(workerResource);
  worker.onmessage = async function (event) {
    if (event.data != false) {
      const currentOperationsData = event.data.currentOperations;
      const printerInfo = event.data.printerInformation;
      const dashboard = event.data.dashStatistics;
      const dashboardSettings = event.data.dashboardSettings;

      if (dashboardSettings.farmActivity.currentOperations) {
        currentOperations(
          currentOperationsData.operations,
          currentOperationsData.count,
          printerInfo
        );
      }

      DashUpdate.farmInformation(
        dashboard.timeEstimates,
        dashboard.utilisationGraph,
        dashboard.temperatureGraph,
        dashboardSettings
      );
      if (dashboardSettings.farmUtilisation.farmUtilisation) {
        DashUpdate.farmUtilisation(dashboard.farmUtilisation);
      }

      DashUpdate.currentStatusAndUtilisation(
        dashboard.currentStatus,
        dashboard.currentUtilisation,
        dashboardSettings.printerStates.currentStatus,
        dashboardSettings.farmUtilisation.currentUtilisation
      );

      if (dashboardSettings.printerStates.printerState) {
        DashUpdate.printerStatus(dashboard.printerHeatMaps.heatStatus);
      }

      if (dashboardSettings.printerStates.printerProgress) {
        DashUpdate.printerProgress(dashboard.printerHeatMaps.heatProgress);
      }
      if (dashboardSettings.printerStates.printerTemps) {
        DashUpdate.printerTemps(dashboard.printerHeatMaps.heatTemps);
      }
      if (dashboardSettings.printerStates.printerUtilisation) {
        DashUpdate.printerUptime(dashboard.printerHeatMaps.heatUtilisation);
      }

      if (dashboardSettings.historical.environmentalHistory) {
        await DashUpdate.environmentalData(dashboard.enviromentalData);
      }
    } else {
      UI.createAlert(
        "warning",
        "Server Events closed unexpectedly... Retying in 10 seconds",
        10000,
        "Clicked"
      );
    }
  };
}

let worker = null;

export function loadClientSSEWorker() {
  // Setup webWorker
  if (window.Worker) {
    // Yes! Web worker support!
    try {
      if (worker === null) {
        createWebWorker();
      }
    } catch (e) {
      console.log(e);
    }
  } else {
    // Sorry! No Web Worker support..
    console.log("Web workers not available... sorry!");
  }

  document.addEventListener("visibilitychange", handleVisibilityChange, false);
}
