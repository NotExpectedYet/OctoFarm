import {
  dragAndDropEnable,
  dragAndDropEnableMultiplePrinters,
  dragCheck
} from "../lib/functions/dragAndDrop.js";
import PrinterManager from "../lib/modules/printerManager.js";
import UI from "../lib/functions/ui.js";
import OctoPrintClient from "../lib/octoprint";
import {
  groupWidth,
  mapRealLimits,
  massDragAndDropId,
  massDragAndDropStatusId,
  selectableTilePrefix,
  stopButtonIdPrefix
} from "./printer-map.options";
import {
  cleanPrinterName,
  combineSubAndNormalCoords,
  convertPrinterURLToXYCoordinate,
  findPrinterWithBlockCoordinate,
  parseGroupLocation
} from "./printer-map.utils";
import { constructPrinterPanelHTML } from "./printer.panel";
import { constructMassDragAndDropPanelHTML } from "./drag-and-drop.panel";
import { getControlList, getPrinterById } from "./printer-map.state";

const elems = [];
let powerTimer = 20000;
let controlModal = false;
let printerManagerModal = document.getElementById("printerManagerModal");
let printerArea = document.getElementById("printerArea");

function attachEventToStopButton(printer) {
  const elementId = stopButtonIdPrefix + printer._id;
  let cancelBtn = document.getElementById(elementId);
  if (!cancelBtn) {
    console.error(
      "Could not attach to click of stop-button as the element selector was not found:",
      elementId
    );
    return;
  }
  cancelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const print = getPrinterById(printer._id);
    const name = printer.printerName;
    bootbox.confirm({
      message: `${name}: <br>Are you sure you want to cancel the ongoing print?`,
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
          e.target.disabled = true;
          const opts = {
            command: "cancel"
          };

          OctoPrintClient.post(print, "job", opts)
            .then((r) => {
              if (r.status === 200 || r.status === 201 || r.status === 204) {
                // Error
                UI.createAlert(
                  "success",
                  `Successfully informed OctoPrint to cancel job!`,
                  4000,
                  "Clicked"
                );
              } else {
                UI.createAlert(
                  "error",
                  `Failed to cancel job, it was probably not running. Code: ${r.status}`,
                  4000,
                  "Clicked"
                );
              }

              e.target.disabled = false;
            })
            .catch((e) => {
              e.target.disabled = false;
              UI.createAlert("error", `Failed to cancel job! Error: ${e}`, 4000, "Clicked");
            });
        }
      }
    });
  });
}

function addListeners(printer, allPrinters) {
  printer.isSelected = false;
  let panel = document.getElementById(`${selectableTilePrefix}-${printer._id}`);
  if (panel) {
    attachEventToStopButton(printer);
    panel.addEventListener("click", (e) => {
      printer.isSelected = panel.classList.toggle("printer-map-tile-selected");

      const massDragAndDropStatusPanel = document.getElementById(massDragAndDropStatusId);
      if (massDragAndDropStatusPanel) {
        const selectedPrinterCount = allPrinters.filter((p) => !!p.isSelected)?.length;
        if (selectedPrinterCount === 0) {
          massDragAndDropStatusPanel.innerHTML = `<span class="badge badge-danger">${selectedPrinterCount} selected</span> select a printer first to mass-upload.`;
        } else {
          massDragAndDropStatusPanel.innerHTML = `<span class="badge badge-success">${selectedPrinterCount} selected</span> Time to print!`;
        }
      } else {
        throw new Error("Element not found! ID: " + massDragAndDropStatusPanel);
      }
    });
  } else {
    throw new Error(
      `Could not find the printer panel to add listeners to, id: ${selectableTilePrefix}-${printer._id}`
    );
  }
  return "done";
}

function grabElements(printer) {
  if (typeof elems[printer._id] !== "undefined") {
    return elems[printer._id];
  } else {
    elems[printer._id] = {
      row: document.getElementById("panel-" + printer._id),
      name: document.getElementById("name-" + printer._id),
      currentFile: document.getElementById("currentFile-" + printer._id),
      state: document.getElementById("state-" + printer._id),
      progress: document.getElementById("progress-" + printer._id)
    };
    return elems[printer._id];
  }
}

async function updateState(printer, clientSettings, view) {
  //Grab elements on page
  const elements = grabElements(printer);
  if (typeof elements.row === "undefined") return; //Doesn't exist can skip updating

  //Check display and skip if not displayed...
  if (printer.display) {
    if (elements.row.style.display === "none") {
      switch (view) {
        case "list":
          elements.row.style.display = "table";
          break;
        case "panel":
          elements.row.style.display = "block";
          break;
      }
    }
  } else {
    if (elements.row.style.display !== "none") {
      elements.row.style.display = "none";
    }
    return;
  }

  let stateCategory = printer.printerState.colour.category;
  if (stateCategory === "Error!") {
    stateCategory = "Offline";
  }
  UI.doesElementNeedUpdating(cleanPrinterName(printer), elements.name, "innerHTML");

  switch (view) {
    case "list":
      UI.doesElementNeedUpdating(stateCategory, elements.row, "classList");
      break;
    case "panel":
      UI.doesElementNeedUpdating(
        `btn btn-block ${stateCategory} mb-1 mt-1`,
        elements.state,
        "classList"
      );
      break;
  }

  //Progress
  UI.doesElementNeedUpdating(
    `progress-bar progress-bar-striped bg-${printer.printerState.colour.name}`,
    elements.progress,
    "classList"
  );
  if (typeof printer.currentJob !== "undefined") {
    let progress = 0;
    if (typeof printer.currentJob.progress === "number") {
      progress = printer.currentJob.progress.toFixed(0);
    }
    UI.doesElementNeedUpdating(progress + "%", elements.progress, "innerHTML");
    elements.progress.style.width = progress + "%";
  } else {
    let printTimeElapsedFormat = "";
    let remainingPrintTimeFormat = "";
    //No Job reset
    UI.doesElementNeedUpdating("", elements.progress, "innerHTML");
    elements.progress.style.width = 0 + "%";
    UI.doesElementNeedUpdating(printTimeElapsedFormat, elements.printTimeElapsed, "innerHTML");
    UI.doesElementNeedUpdating(remainingPrintTimeFormat, elements.remainingPrintTime, "innerHTML");
  }
}

/**
 * Called by worker to init and update page
 * @param printers
 * @param clientSettings
 * @param view
 * @returns {Promise<void>}
 */
export async function init(printers, clientSettings, view) {
  //Check if printer manager modal is opened
  switch (printerManagerModal.classList.contains("show")) {
    case true:
      // Run printer manager updater
      await PrinterManager.init("", printers, getControlList());
      break;
    case false:
      let massDragAndDropPanelDom = document.getElementById(massDragAndDropId);
      if (!massDragAndDropPanelDom) {
        const panelHtml = constructMassDragAndDropPanelHTML();
        printerArea.insertAdjacentHTML("beforeend", panelHtml);

        // Attach drag and drop to mass upload
        massDragAndDropPanelDom = document.getElementById(massDragAndDropId);
        await dragAndDropEnableMultiplePrinters(massDragAndDropPanelDom, printers);
      }

      // initialise or start the information updating..
      const parsedPrinters = [
        ...printers.map((p) => {
          const parsedGroupCoord = parseGroupLocation(p);
          const printerSubCoordinate = convertPrinterURLToXYCoordinate(p);
          return {
            printer: p,
            coord: parsedGroupCoord,
            subCoord: printerSubCoordinate,
            realCoord: !!parsedGroupCoord
              ? combineSubAndNormalCoords(parsedGroupCoord, printerSubCoordinate)
              : undefined
          };
        })
      ];
      for (let realY = mapRealLimits[1] - 1; realY >= 0; realY--) {
        for (let realX = 0; realX < mapRealLimits[0]; realX++) {
          const printerWithCoord = findPrinterWithBlockCoordinate(parsedPrinters, [realX, realY]);
          let printer = null;
          if (!printerWithCoord) {
            // We construct a fakey
            printer = {
              _id: `X${realX}Y${realY}STUB`,
              stub: true,
              printerName: "",
              printerState: {
                colour: {
                  name: "red"
                },
                state: ""
              },
              display: true
            };
          } else {
            printer = printerWithCoord.printer;
          }

          let printerPanel = document.getElementById("panel-" + printer._id);
          if (!printerPanel) {
            let printerHTML = constructPrinterPanelHTML(
              printer,
              [realX, realY],
              clientSettings,
              realX % groupWidth === groupWidth - 1, // Left of gutter (f.e. X=1 of 0|1 2|3 4|5)
              realX % groupWidth === 0 // Right of gutter ((f.e. X=2 of 0|1 2|3 4|5)
            );
            printerArea.insertAdjacentHTML("beforeend", printerHTML);

            //Update the printer panel to the actual one
            printerPanel = document.getElementById("panel-" + printer._id);
            //Add page listeners
            if (!printer.stub) {
              addListeners(printer, printers);
            }
            //Grab elements
            await grabElements(printer);
            //Initialise Drag and Drop
            if (!printer.stub) {
              await dragAndDropEnable(printerPanel, printer);
            }
          } else {
            if (!printerManagerModal.classList.contains("show")) {
              if (!(await dragCheck())) {
                await updateState(printer, clientSettings, view);
              }
              if (powerTimer >= 20000) {
                // Fuk dat, we dont used the buttons but the timer can be nice for anything else
                powerTimer = 0;
              } else {
                powerTimer += 500;
              }
            }
          }
        }
      }
      break;
  }
}
