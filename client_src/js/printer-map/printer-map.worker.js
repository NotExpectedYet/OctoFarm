import currentOperations from "../lib/modules/currentOperations";
import { setPrinterMapState } from "./printer-map.state";
import { init } from "./printer-map.updater";

let worker = null;
let currentView = null;

export function handleVisibilityChange() {
  if (document.hidden) {
    if (worker !== null) {
      worker.terminate();
      worker = null;
    }
  } else {
    if (worker === null) {
      createWebWorker(currentView);
    }
  }
}

export function createWebWorker(view) {
  currentView = view;
  worker = new Worker("/assets/dist/monitoringViewsWorker.min.js");
  worker.onmessage = async function (event) {
    if (event.data != false) {
      //Update global variables with latest information...
      const printerInfo = event.data.printersInformation;
      const printerControlList = event.data.printerControlList;
      setPrinterMapState(printerInfo, printerControlList);

      await init(
        event.data.printersInformation,
        event.data.clientSettings,
        currentView
      );
      if (event.data.clientSettings.panelView.currentOp) {
        const currentOperationsData = event.data.currentOperations;
        currentOperations(
          currentOperationsData.operations,
          currentOperationsData.count,
          printerInfo
        );
      }
    }
  };
}
