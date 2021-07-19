import FileManager from "../modules/fileManager.js";
import UI from "./ui.js";
import Validate from "./validate.js";

let activeFile = false;

export async function dragCheck() {
  return activeFile;
}

export function dragAndDropEnable(element, printer) {
  const dropArea = document.getElementById(element.id);
  // Prevent default drag behaviors
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop area when item is dragged over it
  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(
      eventName,
      (event) => {
        activeFile = true;
        highlight(event, element);
      },
      false
    );
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(
      eventName,
      (event) => {
        activeFile = false;
        unhighlight(event, element);
      },
      false
    );
  });
  dropArea.addEventListener(
    "drop",
    (event) => {
      handleDrop(event, printer);
    },
    false
  );
}

export function dragAndDropEnableMultiplePrinters(element, printers) {
  const dropArea = document.getElementById(element.id);
  // Prevent default drag behaviors
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop area when item is dragged over it
  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(
      eventName,
      (event) => {
        activeFile = true;
        highlight(event, element);
      },
      false
    );
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(
      eventName,
      (event) => {
        activeFile = false;
        unhighlight(event, element);
      },
      false
    );
  });
  dropArea.addEventListener(
    "drop",
    (event) => {
      const selectedOnlyPrinters = printers.filter((p) => !!p.isSelected);
      handleMassDrop(event, selectedOnlyPrinters);
    },
    false
  );
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight(e, currentElement) {
  currentElement.classList.add("highlight");
}

function unhighlight(e, currentElement) {
  currentElement.classList.remove("highlight");
}

function handleDrop(e, currentPrinter, currentElement) {
  const dt = e.dataTransfer;
  const { files } = dt;
  handleFiles(files, [currentPrinter], currentElement);
}

function handleMassDrop(e, printers, currentElement) {
  const dt = e.dataTransfer;
  const { files } = dt;
  handleFiles(files, printers, currentElement);
}

function sendFilesToPrinter(singleFileOnly, printAfterUpload, uploadableFiles, printer) {
  UI.createAlert("warning", `${Validate.getName(printer)}: started upload`, 3000, "Clicked");

  // Only single files can be sent to be printed immediately after upload
  if (printAfterUpload && singleFileOnly) {
    FileManager.handleFiles(uploadableFiles, printer, "print");
  } else {
    FileManager.handleFiles(uploadableFiles, printer);
  }
}

export function handleFiles(uploadableFiles, printerArray) {
  if (!printerArray || printerArray.length === 0) {
    return;
  }
  const singleFileOnly = uploadableFiles.length === 1;
  if (singleFileOnly) {
    bootbox.confirm({
      message: "Would you like to print upon upload?",
      buttons: {
        confirm: {
          label: "Yes",
          className: "btn-success"
        },
        cancel: {
          label: "No",
          className: "btn-danger"
        }
      },
      callback(bootBoxConfirmed) {
        printerArray.forEach((printer) => {
          sendFilesToPrinter(true, bootBoxConfirmed, uploadableFiles, printer);
        });
      }
    });
  } else {
    printerArray.forEach((printer) => {
      sendFilesToPrinter(false, false, uploadableFiles, printer);
    });
  }
}
