import { DashUpdate } from "./dashboard.updater";
import UI from "../lib/functions/ui";
import currentOperations from "../lib/modules/currentOperations";

export const workerURL = "/dashboard/sse/";

export async function dashboardSSEventHandler(data) {
  if (data != false) {
    const currentOperationsData = data.currentOperations;
    const printerInfo = data.printerInformation;
    const dashboard = data.dashStatistics;
    const dashboardSettings = data.dashboardSettings;
    if (dashboardSettings.farmActivity.currentOperations) {
      currentOperations(currentOperationsData.operations, currentOperationsData.count, printerInfo);
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
}
