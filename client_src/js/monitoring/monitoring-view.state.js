// Store the current active view type like camera, panel, location map or list
let currentViewType = "none";
const viewTypes = ["panel", "list", "camera", "map"];

let printerInfo = null;
let printerControlList = null;

/**
 * Let the monitoring view updater handle the proper view type
 * @param inputViewType
 */
export function setViewType(inputViewType) {
  if (!viewTypes.includes(inputViewType)) {
    console.warn("Monitoring view: Unknown view type set");
  }

  currentViewType = inputViewType;
}

export function getViewType() {
  return currentViewType;
}

/**
 * Set the state passed down from the server regularly
 * @param newPrinterInfo
 * @param controlList
 */
export function setMonitoringPrinterInfo(newPrinterInfo, controlList) {
  printerInfo = newPrinterInfo;
  printerControlList = controlList;
}

export function getPrinterInfo() {
  return printerInfo;
}

export function getControlList() {
  return printerControlList;
}
