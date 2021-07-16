let printerInfo = null;
let printerControlList = null;

let modalPrinter = null;

export function setPrinterMapState(newPrinterInfo, controlList) {
  printerInfo = newPrinterInfo;
  printerControlList = controlList;
}

/**
 * Set the modal state for the Quick Actions Modal
 * @param id
 */
export function setModalPrinter(id) {
  if (!id) {
    modalPrinter = null;
  } else {
    modalPrinter = getPrinterById(id);
  }
}

/**
 * Get the modal state for the Quick Actions Modal
 * @returns {null}
 */
export function getModalPrinter() {
  return modalPrinter;
}

export function getPrinters() {
  return printerInfo;
}

export function getPrinterById(printerId) {
  if (!printerId) return null;
  return printerInfo.find((pi) => pi._id === printerId);
}

export function getControlList() {
  return printerControlList;
}
