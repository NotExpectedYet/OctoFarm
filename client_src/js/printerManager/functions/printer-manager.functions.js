import UI from "../../lib/functions/ui";
import OctoFarmClient from "../../lib/octofarm_client.js";
import { updateConnectionLog } from "../connection-log";
import { createOrUpdatePrinterTableRow } from "../printer-data";
import PowerButton from "../../lib/modules/powerButton";
import PrinterManager from "../../lib/modules/printerManager";
import { updatePrinterSettingsModal } from "../../lib/modules/printerSettings";
import Validate from "../../lib/functions/validate";
import { PrintersManagement } from "../printer-constructor";
import PrinterSelect from "../../lib/modules/printerSelect";
import FileOperations from "../../lib/functions/file";
import { createPrinterAddInstructions } from "../templates/printer-add-instructions.template";

let powerTimer = 5000;

export function workerEventFunction(data) {
  if (data != false) {
    const modalVisibility = UI.checkIfAnyModalShown();

    if (!modalVisibility) {
      if (data.currentTickerList.length > 0) {
        updateConnectionLog(data.currentTickerList);
      }
      if (data.printersInformation.length > 0) {
        createOrUpdatePrinterTableRow(
          data.printersInformation,
          data.printerControlList
        );
      }
      // TODO clean up power buttons wants to be in printer-data.js
      if (powerTimer >= 5000) {
        data.printersInformation.forEach((printer) => {
          PowerButton.applyBtn(printer, "powerBtn-");
        });
        powerTimer = 0;
      } else {
        powerTimer += 500;
      }
    } else {
      if (UI.checkIfSpecificModalShown("printerManagerModal")) {
        PrinterManager.init(
          "",
          data.printersInformation,
          data.printerControlList
        );
      }

      if (UI.checkIfSpecificModalShown("printerSettingsModal")) {
        updatePrinterSettingsModal(data.printersInformation);
      }
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

export async function scanNetworkForDevices() {
  e.target.disabled = true;
  UI.createAlert(
    "info",
    "Scanning your network for new devices now... Please wait!",
    20000
  );
  try {
    const scannedPrinters = await OctoFarmClient.get("printers/scanNetwork");
    for (let index = 0; index < scannedPrinters.length; index++) {
      const printer = {
        printerURL: "",
        cameraURL: "",
        name: "",
        group: "",
        apikey: ""
      };

      if (typeof scannedPrinters[index].name !== "undefined") {
        printer.name = scannedPrinters[index].name;
      }
      if (typeof scannedPrinters[index].url !== "undefined") {
        printer.printerURL = scannedPrinters[index].url;
      }
      PrintersManagement.addPrinter(printer);
    }
    UI.createAlert(
      "success",
      "Devices on your network have been scanned, any successful matches should now be visible to add to OctoFarm.",
      3000,
      "Clicked"
    );
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      "There we're issues scanning your network for devices... please check the logs",
      0,
      "clicked"
    );
  }
  e.target.disabled = false;
}

export async function reSyncPrinters() {
  const searchOffline = document.getElementById("searchOfflineBtn");
  let alert = UI.createAlert(
    "success",
    "Started a background re-sync of all printers connected to OctoFarm. You may navigate away from this screen."
  );
  searchOffline.innerHTML =
    '<i class="fas fa-redo fa-sm fa-spin"></i> Syncing...';
  try {
    const post = await OctoFarmClient.post("printers/reScanOcto", {
      id: null
    });
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      "There was an issue re-syncing your printers, please check the logs"
    );
  }
  alert.close();
  searchOffline.innerHTML = '<i class="fas fa-redo fa-sm"></i> Re-Sync';
}

export async function bulkEditPrinters() {
  let editedPrinters = [];
  let inputBoxes = document.querySelectorAll("*[id^=editPrinterCard-]");
  for (let i = 0; i < inputBoxes.length; i++) {
    if (inputBoxes[i]) {
      let printerID = inputBoxes[i].id;
      printerID = printerID.split("-");
      printerID = printerID[1];

      const printerURL = document.getElementById(`editInputURL-${printerID}`);
      const printerCamURL = document.getElementById(
        `editInputCamera-${printerID}`
      );
      const printerAPIKEY = document.getElementById(
        `editInputApikey-${printerID}`
      );
      const printerGroup = document.getElementById(
        `editInputGroup-${printerID}`
      );
      const printerName = document.getElementById(`editInputName-${printerID}`);
      //Check if value updated, if not fill in the old value from placeholder
      if (
        printerURL.value.length !== 0 ||
        printerCamURL.value.length !== 0 ||
        printerAPIKEY.value.length !== 0 ||
        printerGroup.value.length !== 0 ||
        printerName.value.length !== 0
      ) {
        if (printerURL.value.length === 0) {
          printerURL.value = printerURL.placeholder;
        }
        if (printerCamURL.value.length === 0) {
          printerCamURL.value = printerCamURL.placeholder;
        }
        if (printerAPIKEY.value.length === 0) {
          printerAPIKEY.value = printerAPIKEY.placeholder;
        }
        if (printerGroup.value.length === 0) {
          printerGroup.value = printerGroup.placeholder;
        }
        if (printerName.value.length === 0) {
          printerName.value = printerName.placeholder;
        }
        const printer = new PrintersManagement(
          Validate.stripHTML(printerURL.value),
          Validate.stripHTML(printerCamURL.value),
          Validate.stripHTML(printerAPIKEY.value),
          Validate.stripHTML(printerGroup.value),
          Validate.stripHTML(printerName.value)
        ).build();
        printer._id = printerID;
        editedPrinters.push(printer);
      }
    }
  }

  if (editedPrinters.length > 0) {
    try {
      const editedPrinters = await OctoFarmClient.post(
        "printers/update",
        editedPrinters
      );
      const printersAdded = editedPrinters.printersAdded;
      printersAdded.forEach((printer) => {
        UI.createAlert(
          "success",
          `Printer: ${printer.printerURL} information has been updated on the farm...`,
          1000,
          "Clicked"
        );
      });
    } catch (e) {
      console.error(e);
      UI.createAlert(
        "error",
        "Something went wrong updating the Server...",
        3000,
        "Clicked"
      );
    }
  }
}
export async function bulkDeletePrinters() {
  const deletedPrinters = [];
  //Grab all check boxes
  const selectedPrinters = PrinterSelect.getSelected();
  selectedPrinters.forEach((element) => {
    const ca = element.id.split("-");
    deletedPrinters.push(ca[1]);
  });
  await PrintersManagement.deletePrinter(deletedPrinters);
}
export async function exportPrintersToJson() {
  try {
    let printers = await OctoFarmClient.post("printers/printerInfo", {});
    const printersExport = [];
    for (let r = 0; r < printers.length; r++) {
      const printer = {
        name: printers[r].printerName,
        group: printers[r].group,
        printerURL: printers[r].printerURL,
        cameraURL: printers[r].cameraURL,
        apikey: printers[r].apikey
      };
      printersExport.push(printer);
    }
    FileOperations.download("printers.json", JSON.stringify(printersExport));
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Error exporting printers, please check logs: ${e}`,
      3000,
      "clicked"
    );
  }
}
export async function importPrintersFromJsonFile() {
  const Afile = this.files;
  if (Afile[0].name.includes(".json")) {
    const files = Afile[0];
    const reader = new FileReader();
    reader.onload = await PrintersManagement.importPrinters(files);
    reader.readAsText(files);
  } else {
    // File not json
    UI.createAlert("error", "File type not .json!", 3000);
  }
}

export function addBlankPrinterToTable() {
  const currentPrinterCount =
    document.getElementById("printerTable").rows.length;
  const newPrinterCount =
    document.getElementById("printerNewTable").rows.length;
  if (currentPrinterCount === 1 && newPrinterCount === 1) {
    bootbox.alert({
      message: createPrinterAddInstructions(),
      size: "large",
      scrollable: false
    });
  }
  PrintersManagement.addPrinter();
}

export function deleteAllOnAddPrinterTable() {
  let onScreenButtons = document.querySelectorAll("*[id^=delButton-]");
  for (const btn of onScreenButtons) {
    btn.click();
  }
}
export async function saveAllOnAddPrinterTable() {
  const deleteAllBtn = document.getElementById("delAllBtn");
  const saveAllBtn = document.getElementById("saveAllBtn");
  saveAllBtn.disabled = true;
  deleteAllBtn.disabled = true;
  let onScreenButtons = document.querySelectorAll("*[id^=saveButton-]");
  let onScreenDelete = document.querySelectorAll("*[id^=delButton-]");
  for (const btn of onScreenButtons) {
    btn.disabled = true;
  }
  for (const btn of onScreenDelete) {
    btn.disabled = true;
  }
  UI.createAlert(
    "warning",
    "Starting to save all your instances... this may take some time...",
    onScreenButtons.length * 1500
  );
  for (const btn of onScreenButtons) {
    btn.disabled = false;
    btn.click();
    await delay(1500);
  }
  UI.createAlert("success", "Successfully saved all your instances", 4000);
  saveAllBtn.disabled = false;
  deleteAllBtn.disabled = true;
}
