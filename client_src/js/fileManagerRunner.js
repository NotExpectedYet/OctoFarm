import OctoFarmClient from "./lib/octofarm.js";
import Calc from "./lib/functions/calc.js";
import FileManager from "./lib/modules/fileManager.js";
import { dragAndDropEnable } from "./lib/functions/dragAndDrop.js";
import {
  returnDropDown,
  selectFilament
} from "./lib/modules/filamentManagerPlugin.js";
import FileSorting from "./lib/modules/fileSorting.js";

let lastId = null;

//Setup global listeners...
document.getElementById("multUploadBtn").addEventListener("click", (e) => {
  FileManager.multiUpload();
});

class Manager {
  static async init() {
    // Draw printers
    let printers = await OctoFarmClient.post("printers/printerInfo", {});
    printers = await printers.json();

    // Draw first printer list...
    const filamentDropDown = await returnDropDown();
    const printerList = document.getElementById("printerList");

    //Get online printers...
    const onlinePrinterList = [];
    printers.forEach((printer) => {
      if (printer.printerState.colour.category !== "Offline") {
        onlinePrinterList.push(printer);
      }
    });
    onlinePrinterList.forEach((printer, index) => {
      let extruderList = "";
      for (let i = 0; i < printer.currentProfile.extruder.count; i++) {
        extruderList += `<div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="tool${i}-${printer._id}">Filament:</label> </div> <select class="custom-select bg-secondary text-light" id="tool${i}-${printer._id}"></select></div>`;
      }
      printerList.insertAdjacentHTML(
        "beforeend",
        `
        <a
            data-jplist-item
            id="fileManagerPrinter-${printer._id}"
            class="list-group-item list-group-item-action flex-column align-items-start bg-secondary"
            style="display: block;
            padding: 0.7rem 0.1rem;"
          >
            <div class="row">
              <div
                class="col-lg-2"
                style="display:flex; justify-content:center; align-items:center;"
              >
                <center><i class="fas fa-print fa-2x"></i><br>
                <td><small><span title="${printer.printerState.desc}" id="printerBadge-${printer._id}" class="tag badge badge-${printer.printerState.colour.name} badge-pill ${printer.printerState.colour.category}">
                        ${printer.printerState.state}</span></small></td></center>
              </div>
              <div class="col-lg-10">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">
                    <span id="printerName-${printer._id}">
                        ${printer.printerName}
                    </span>
        
                  </h5>
                  <small>
                    <span class="float-right badge badge-dark badge-pill">
                        Files: ${printer.fileList.filecount} / Folders: ${printer.fileList.folderCount}
                    </span></small
                  >
                </div>
        
                <div
                  class="float-right btn-group flex-wrap btn-group-sm"
                  role="group"
                  aria-label="Basic example"
                >
                 
        
                </div>
                <div class="row">
                  <div class="col-lg-2">
                    <i class="fas fa-file-upload"></i><span id="fileCounts-${printer._id}"> 0 </span>
                  </div>
                  <div class="col-lg-10">
                    <div class="progress">
                      <div id="fileProgress-${printer._id}" class="progress-bar progress-bar-striped bg-warning" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                        0%
                      </div>
                    </div>
                  </div>
                </div>


        
        
                  <small class="pt-2 float-left"
                  ><i class="fas fa-cube"></i> <b>H:</b> ${printer.currentProfile.volume.height}mm x <b>W:</b> ${printer.currentProfile.volume.width}mm x <b>D:</b> ${printer.currentProfile.volume.depth}mm</small
                ><br><!--Fix for firefox-->
                <small class="pt-2 float-left"
                  ><i class="fas fa-pen"></i> <b>Extruders:</b>
                  ${printer.currentProfile.extruder.count}
                  <b>Nozzle Size:</b> 
                  ${printer.currentProfile.extruder.nozzleDiameter}mm</small
                >
                
                                ${extruderList}
              </div>
            </div>
          </a>
              
      `
      );
      //Setup for first printer
      const listItem = document.getElementById(
        `fileManagerPrinter-${printer._id}`
      );

      listItem.addEventListener("click", (e) => {
        if (!e.target.id.includes("tool")) {
          Manager.changePrinter(e, printer._id);
        }
      });

      dragAndDropEnable(listItem, printer);

      for (let i = 0; i < printer.currentProfile.extruder.count; i++) {
        const filamentDrop = document.getElementById(
          "tool" + i + "-" + printer._id
        );
        filamentDrop.innerHTML = "";
        filamentDropDown.forEach((filament) => {
          filamentDrop.insertAdjacentHTML("beforeend", filament);
        });
        if (
          Array.isArray(printer.selectedFilament) &&
          printer.selectedFilament.length !== 0
        ) {
          if (
            typeof printer.selectedFilament[i] !== "undefined" &&
            printer.selectedFilament[i] !== null
          ) {
            filamentDrop.value = printer.selectedFilament[i]._id;
          }
        }
        filamentDrop.addEventListener("change", async (event) => {
          selectFilament(printer._id, event.target.value, i);
          setTimeout(async () => {
            let updatePrinter = await OctoFarmClient.post(
              "printers/printerInfo",
              {
                i: lastId
              }
            );
            updatePrinter = await updatePrinter.json();
            FileManager.refreshFiles(updatePrinter);
          }, 1000);
        });
      }

      if (index === 0) {
        lastId = printer._id;
        const item = document.getElementById(
          "fileManagerPrinter-" + printer._id
        );
        item.classList.add("bg-dark");
        item.classList.remove("bg-secondary");
        const firstElement = document.getElementById("currentPrinter");
        firstElement.innerHTML =
          '<i class="fas fa-print"></i> ' + printer.printerName;
        FileSorting.loadSort(printer);
        Manager.updatePrinterList(printer._id);
      }
    });
  }

  static changePrinter(e, target) {
    if (!e.target.id.includes("filamentDrop")) {
      //Set old one deselected
      document.getElementById("fileBody").innerHTML = "";
      document.getElementById("currentFolder").innerHTML = "local";
      document.getElementById("fileManagerPrinter-" + lastId).className =
        "list-group-item list-group-item-action flex-column align-items-start bg-secondary";

      //Update old index to this one
      lastId = target;
      const printerName = document.getElementById(
        "printerName-" + lastId
      ).innerHTML;
      const panel = document.getElementById("fileManagerPrinter-" + target);

      panel.classList.add("bg-dark");
      panel.classList.remove("bg-secondary");
      const firstElement = document.getElementById("currentPrinter");
      firstElement.innerHTML = '<i class="fas fa-print"></i> ' + printerName;
      Manager.updatePrinterList(target);
    }
  }

  static async updatePrinterList(id) {
    let fileList = document.getElementById("fileBody");
    const fileManagerManagement = document.getElementById(
      "fileManagerManagement"
    );
    if (fileManagerManagement) {
      fileList = fileManagerManagement;
    }
    fileList.innerHTML = `
         <div class="row mb-1">
          <div class="col-12">
         

            <label class="btn btn-success float-left mr-1 mb-0 bg-colour-1" for="fileUploadBtn"><i class="fas fa-file-import"></i> Upload File(s)</label>
            <input id="fileUploadBtn" multiple accept=".gcode,.gco,.g" type="file" class="btn btn-success float-left bg-colour-1" id="uploadFileBtn">
            <label class="btn btn-info float-left mr-1 mb-0 bg-colour-2" for="fileUploadPrintBtn"><i class="fas fa-file-import"></i> Upload and Print</label>
            <input id="fileUploadPrintBtn" accept=".gcode,.gco,.g" type="file" class="btn btn-success float-left bg-colour-2" id="uploadFileBtn">

            <button
                    id="createFolderBtn"
                    type="button"
                    class="btn btn-warning float-left mr-1 mb-0 bg-colour-3"
                    data-toggle="collapse"
                    href="#createFolder"
                    role="button"
                    aria-expanded="false"
                    aria-controls="createFolder"
            >
              <i class="fas fa-folder-plus"></i> Create Folder
            </button>
            <button id="fileReSync" type="button" class="btn btn-primary mb-0 bg-colour-4">
              <i class="fas fa-sync"></i> Re-Sync
            </button>
          </div>

        </div>
        `;
    document.getElementById("fileBody").insertAdjacentHTML(
      "beforeend",
      `
            <div id="fileList-${id}" class="list-group" style="max-height:100%; overflow-y:scroll; min-height:1000px;" data-jplist-group="files">
                
            </div>
        `
    );
    let printer = await OctoFarmClient.post("printers/printerInfo", {
      i: id
    });
    printer = await printer.json();
    FileSorting.loadSort(printer);
    document.getElementById("backBtn").innerHTML = `
          <button id="fileBackBtn" type="button" class="btn btn-success">
                  <i class="fas fa-chevron-left"></i> Back
                </button>`;
    const fileButtons = {
      fileManager: {
        printerStorage: document.getElementById("printerStorage"),
        fileFolderCount: document.getElementById("printerFileCount"),
        fileSearch: document.getElementById("searchFiles"),
        uploadFiles: document.getElementById("fileUploadBtn"),
        uploadPrintFile: document.getElementById("fileUploadPrintBtn"),
        syncFiles: document.getElementById("fileReSync"),
        back: document.getElementById("fileBackBtn"),
        createFolderBtn: document.getElementById("createFolderBtn")
      }
    };
    fileButtons.fileManager.fileFolderCount.innerHTML = `<i class="fas fa-file"></i> ${printer.fileList.filecount} <i class="fas fa-folder"></i> ${printer.fileList.folderCount}`;
    if (typeof printer.storage !== "undefined") {
      fileButtons.fileManager.printerStorage.innerHTML = `<i class="fas fa-hdd"></i> ${Calc.bytes(
        printer.storage.free
      )} / ${Calc.bytes(printer.storage.total)}`;
    } else {
      fileButtons.fileManager.printerStorage.innerHTML = `<i class="fas fa-hdd"></i> ${Calc.bytes(
        0
      )} / ${Calc.bytes(0)}`;
    }

    fileButtons.fileManager.uploadFiles.addEventListener("change", function () {
      FileManager.handleFiles(this.files, printer);
    });
    fileButtons.fileManager.createFolderBtn.addEventListener("click", (e) => {
      FileManager.createFolder(printer);
    });
    fileButtons.fileManager.fileSearch.addEventListener("keyup", (e) => {
      FileManager.search(printer._id);
    });
    fileButtons.fileManager.uploadPrintFile.addEventListener(
      "change",
      function () {
        FileManager.handleFiles(this.files, printer, "print");
      }
    );
    fileButtons.fileManager.back.addEventListener("click", (e) => {
      FileManager.openFolder(undefined, undefined, printer);
    });
    fileButtons.fileManager.syncFiles.addEventListener("click", (e) => {
      FileManager.reSyncFiles(e, printer);
    });
  }
}

Manager.init();
