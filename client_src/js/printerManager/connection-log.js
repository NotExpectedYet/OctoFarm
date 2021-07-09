import { formatDateStringHumanReadable } from "../utils/time.util.js";

let tickerMessageBox = document.getElementById("printerTickerMessageBox");
let tickerMessageBoxStatus = document.getElementById(
  "printerManagementConnectionLogStatus"
);

/**
 * Checks if the ticker contains the loader element and removes it.
 * Also updates the tickers styling to remove the d-flex class.
 */
function checkIfLoaderExistsAndRemove() {
  const loader = document.getElementById("printerTickerLoader");
  if (loader) {
    tickerMessageBox.classList.remove("d-flex");
    loader.remove();
  }
}

/**
 * Checks if the ticker line already exists
 */
function checkIfElementExistsInTicker(elementID) {
  return !document.getElementById(elementID);
}

/**
 * Updates the log lines element with log count
 */
function updateStatus(lineLength) {
  tickerMessageBoxStatus.innerText = lineLength;
}

/**
 * Updates the printer ticker on printer manager
 */
export function updateConnectionLog(list) {
  const textList = "";
  checkIfLoaderExistsAndRemove();
  updateStatus(list.length);
  list.forEach((e) => {
    if (checkIfElementExistsInTicker(e.id)) {
      let date = formatDateStringHumanReadable(e.date);
      tickerMessageBox.insertAdjacentHTML(
        "afterbegin",
        `<div id="${e.id}" style="width: 100%; font-size:11px;" class="text-left ${e.state} text-wrap"> ${date} | ${e.printer} | ${e.message}</div>`
      );
    }
  });
}
