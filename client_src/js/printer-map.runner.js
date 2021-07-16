import {
  actionDeleteAllFilesId,
  actionDeleteOldFilesId,
  actionFileDeleteClass,
  actionFileReprintClass,
  modalPrintFilesListId,
  oldFileCriteriumDays,
  quickActionsModalId
} from "./printer-map/printer-map.options";
import {
  createWebWorker,
  handleVisibilityChange
} from "./printer-map/printer-map.worker";
import OctoFarmclient from "./lib/octofarm";
import {
  getModalPrinter,
  setModalPrinter
} from "./printer-map/printer-map.state";
import {
  printerQuickActionsModal,
  resetProgressBar,
  setProgressBar
} from "./printer-map/printer-quick-actions.modal";
import { FileActions } from "./lib/modules/fileManager";
import UI from "./lib/functions/ui";
import OctoPrintClient from "./lib/octoprint";
import {
  fileListStorageSize,
  findOldFiles
} from "./printer-map/printer-map.utils";
import { humanFileSize } from "./utils/file-size.util";

document.addEventListener("visibilitychange", handleVisibilityChange, false);
document.getElementById("filterStates").addEventListener("change", (e) => {
  OctoFarmclient.get("client/updateFilter/" + e.target.value);
});
document.getElementById("sortStates").addEventListener("change", (e) => {
  OctoFarmclient.get("client/updateSorting/" + e.target.value);
});

createWebWorker("panel");

async function startPrint(printer, filePath) {
  const opts = {
    command: "start"
  };
  let loadFile = await OctoPrintClient.file(printer, filePath, "load");
  if (loadFile) {
    await OctoPrintClient.jobAction(printer, opts);
  } else {
    UI.createAlert("error", "Could not select file", 3000, "clicked");
  }
}

function askConfirmation(message, cb) {
  return bootbox.confirm({
    message: message || `Are you sure you want to perform this action?`,
    buttons: {
      cancel: {
        label: '<i class="fa fa-times"></i> Cancel'
      },
      confirm: {
        label: '<i class="fa fa-check"></i> Confirm'
      }
    },
    callback: async (result) => {
      if (result) cb(result);
    }
  });
}

/**
 * Remove 2 weeks old files or delete all
 * @param files all or filtered array of files to be cleared
 * @returns {Promise<void>}
 */
async function clearFiles(files) {
  const printer = getModalPrinter();

  const acceptedFiles = [];
  const deniedFiles = [];
  const unknownCauseFiles = [];
  for (let file of files) {
    const fileExistsStatus = await OctoPrintClient.checkFile(
      printer,
      file.fullPath
    );
    if (fileExistsStatus === 200) {
      acceptedFiles.push(file);
    } else if (fileExistsStatus === 404) {
      deniedFiles.push(file);
    } else {
      unknownCauseFiles.push(file);
    }
  }

  resetProgressBar(acceptedFiles.length);

  // Handle the files
  if (deniedFiles.length > 0 || unknownCauseFiles.length > 0) {
    UI.createAlert(
      "warning",
      `${
        deniedFiles.length + unknownCauseFiles.length
      } files were not found or didnt load on OctoPrint... skipping these.`,
      3000,
      "clicked"
    );
  }

  const failedFiles = [];
  const succeededFiles = [];
  for (let file of acceptedFiles) {
    const responseOctoFarm = await OctoPrintClient.file(
      printer,
      file.fullPath,
      "delete",
      false
    );

    if (responseOctoFarm.status > 204) {
      failedFiles.push(file);
    } else {
      succeededFiles.push(file);
    }

    setProgressBar(
      succeededFiles.length,
      failedFiles.length,
      acceptedFiles.length
    );

    // I dont care too much what OF does, as long as its consistent
    // const statusString = await responseOctoFarm.text();
    // console.log(statusString);
    document.getElementById(`file-${file.fullPath}`).remove();
  }

  UI.createAlert(
    "success",
    `Successfully cleared ${acceptedFiles.length} of your files.`,
    3000,
    "clicked"
  );
}

function clearFile(fileId, confirm = true) {
  const modalPrinter = getModalPrinter();
  const file = modalPrinter.fileList.fileList[fileId];
  if (!file) {
    if (confirm) {
      UI.createAlert(
        "error",
        "There was a bug during finding the file for deletion... report this.",
        3000,
        "clicked"
      );
    }
    return false;
  }

  FileActions.deleteFile(modalPrinter, file.fullPath);
}

async function startFilePrint(fileId) {
  const modalPrinter = getModalPrinter();
  const file = modalPrinter.fileList.fileList[fileId];
  if (!file) {
    UI.createAlert(
      "error",
      "There was a bug during finding the file... report this.",
      3000,
      "clicked"
    );
    return;
  }

  await startPrint(modalPrinter, file.fullPath);
}

$(quickActionsModalId).on("show.bs.modal", function (event) {
  const button = $(event.relatedTarget);
  const loadPrinterId = button.data("printer-id");
  setModalPrinter(loadPrinterId);
  const modal = $(this);

  const modalPrinter = getModalPrinter();

  modal.find(".modal-title").html(`
    Quick actions for printer <span class="badge badge-primary">${modalPrinter.printerName}</span>
    `);
  modal.find(".modal-body input").val(loadPrinterId);
  modal
    .find(`.modal-body ${modalPrintFilesListId}`)
    .html(printerQuickActionsModal(modalPrinter));

  $(actionDeleteAllFilesId).click(async (event) => {
    const fileList = modalPrinter.fileList.fileList;

    const totalStorage = modalPrinter.storage.total;
    const clearedStorageAllFiles = fileListStorageSize(fileList);
    const clearedRatio = (clearedStorageAllFiles / totalStorage) * 100;

    const msg = `Are you sure to delete ${fileList.length} files on printer '${
      modalPrinter.printerName
    }'? This saves ${humanFileSize(
      clearedStorageAllFiles
    )} [${clearedRatio.toFixed(1)} % of ${humanFileSize(totalStorage)}]`;

    askConfirmation(msg, async (result) => await clearFiles(fileList));
  });

  $(actionDeleteOldFilesId).click(async (event) => {
    const fileList = modalPrinter.fileList.fileList;
    const oldFiles = findOldFiles(fileList, oldFileCriteriumDays);

    const totalStorage = modalPrinter.storage.total;
    const clearedStorageOldFiles = fileListStorageSize(oldFiles);
    const clearedRatio = (clearedStorageOldFiles / totalStorage) * 100;

    const msg = `Are you sure to delete ${oldFiles.length} files on printer '${
      modalPrinter.printerName
    }' older than 2 weeks? This saves ${humanFileSize(
      clearedStorageOldFiles
    )} [${clearedRatio.toFixed(1)} % of ${humanFileSize(totalStorage)}]`;

    askConfirmation(msg, async (result) => await clearFiles(oldFiles));
  });

  $(actionFileDeleteClass).click((event) => {
    const fileId = parseInt(event.target.dataset?.fileId, 0);
    clearFile(fileId);
  });

  $(actionFileReprintClass).click(async (event) => {
    const fileId = parseInt(event.target.dataset?.fileId, 0);
    await startFilePrint(fileId);
  });
});
