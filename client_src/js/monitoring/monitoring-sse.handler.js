import currentOperations from "../lib/modules/currentOperations";
import { getViewType, setMonitoringPrinterInfo } from "./monitoring-view.state";
import { initMonitoring } from "./monitoring.updater";

let controlModal = false;
export const monitoringWorkerURL = "/monitoringInfo/get/";

export async function monitoringSSEventHandler(data) {
  if (data != false) {
    //Update global variables with latest information...
    const printerInfo = data.printersInformation;
    const printerControlList = data.printerControlList;

    setMonitoringPrinterInfo(printerInfo, printerControlList);

    //Grab control modal element...
    if (!controlModal) {
      controlModal = document.getElementById("printerManagerModal");
    }
    await initMonitoring(printerInfo, data.clientSettings, getViewType());

    if (event.data.clientSettings.panelView.currentOp) {
      const currentOperationsData = data.currentOperations;
      currentOperations(currentOperationsData.operations, currentOperationsData.count, printerInfo);
    }
  }
}
