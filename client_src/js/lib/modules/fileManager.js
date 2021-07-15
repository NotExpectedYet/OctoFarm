import OctoFarmClient from "../octofarm.js";
import OctoPrintClient from "../octoprint.js";
import Queue from "./clientQueue.js";
import Calc from "../functions/calc.js";
import UI from "../functions/ui.js";
import { dragAndDropEnableMultiplePrinters } from "../functions/dragAndDrop.js";
import FileSorting from "./fileSorting.js";
import PrinterSelect from "./printerSelect.js";

const fileUploads = new Queue();

const fileSortInit = false;
const sortableFileList = null;

setInterval(async () => {
  //Auto refresh of files

  // If there are files in the queue, plow through until uploaded... currently single file at a time.
  if (fileUploads.size() > 0) {
    const current = fileUploads.first();
    if (!current.active) {
      fileUploads.activate(0);
      const currentDate = new Date();
      let file = await current.upload(current);
      file = JSON.parse(file);
      file.index = current.index;
      file.uploadDate = currentDate.getTime() / 1000;
      const post = await OctoFarmClient.post("printers/newFiles", file);
      const update = await FileManager.drawFile(file);
      fileUploads.remove();
      const fileCounts = document.getElementById(`fileCounts-${current.index}`);
      if (fileCounts && fileCounts.innerHTML == 1) {
        fileCounts.innerHTML = ` ${0}`;
      }
    }
  }
  const allUploads = fileUploads.all();
  allUploads.forEach((uploads) => {
    const currentCount = allUploads.reduce(function (n, up) {
      return n + (up.index == uploads.index);
    }, 0);
    const fileCounts = document.getElementById(`fileCounts-${uploads.index}`);
    if (fileCounts) {
      fileCounts.innerHTML = ` ${currentCount}`;
    }
  });
}, 1000);

export default class FileManager {
  static async handleFiles(Afiles, printerInfo, print) {
    Afiles = [...Afiles];
    for (let i = 0; i < Afiles.length; i++) {
      const newObject = {};
      const spinner = document.getElementById("fileUploadCountSpinner");
      if (spinner) {
        if (spinner.classList.contains("fa-spin")) {
        } else {
          spinner.classList = "fas fa-spinner fa-spin";
        }
      }

      newObject.file = Afiles[i];
      if (typeof print !== "undefined") {
        newObject.print = true;
      }
      newObject.index = printerInfo._id;
      newObject.printerInfo = printerInfo;
      const currentFolder = document.getElementById("currentFolder");
      if (currentFolder) {
        newObject.currentFolder = currentFolder.innerHTML;
      } else {
        newObject.currentFolder = "local/";
      }
      newObject.upload = FileManager.fileUpload;
      fileUploads.add(newObject);
    }
  }

  static createUpload(index, fileName, loaded, total) {
    const uploadSize = fileUploads.size();
    const upCount = document.getElementById("fileUploadCount");
    if (upCount) {
      upCount.innerHTML = `File Queue: ${uploadSize}`;
      if (uploadSize < 1) {
        upCount.innerHTML = "File Queue: 0";
        const spinner = document.getElementById("fileUploadCountSpinner");
        if (spinner.classList.contains("fa-spin")) {
          spinner.classList = "fas fa-spinner";
        }
      }
    }

    const progress = document.getElementById(`fileProgress-${index}`);
    if (progress) {
      progress.classList = "progress-bar progress-bar-striped bg-warning";
      let percentLoad = (loaded / total) * 100;
      if (isNaN(percentLoad)) {
        percentLoad = 0;
      }
      progress.innerHTML = `${Math.floor(percentLoad)}%`;
      progress.style.width = `${percentLoad}%`;
      if (percentLoad == 100) {
        progress.classList = "progress-bar progress-bar-striped bg-success";
      }
    }
  }

  static fileUpload(file) {
    return new Promise(function (resolve, reject) {
      // Grab folder location
      const { currentFolder } = file;
      // Grab Client Info

      const { index } = file;
      const { printerInfo } = file;

      // XHR doesn't like posting without it been a form, can't use offical octoprint api way...
      // Create form data
      const formData = new FormData();
      let path = "";
      if (currentFolder.includes("local/")) {
        path = currentFolder.replace("local/", "");
      }

      formData.append("file", file.file);
      formData.append("path", path);
      if (file.print) {
        formData.append("print", true);
      }
      const url = `${printerInfo.printerURL}/api/files/local`;
      const xhr = new XMLHttpRequest();
      file = file.file;
      xhr.open("POST", url);
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
          FileManager.createUpload(printerInfo._id, file.name, e.loaded, e.total);
        }
      };

      // xhr.setRequestHeader("Content-Type", "multipart/form-data");
      xhr.setRequestHeader("X-Api-Key", printerInfo.apikey);
      xhr.onloadstart = function (e) {
        FileManager.createUpload(printerInfo._id, file.name, e.loaded, e.total);
      };
      xhr.onloadend = async function (e) {
        const spinnerIcon =
          '<i class="fas fa-spinner fa-pulse"></i> Checking Octoprint for information... <br>';
        FileManager.createUpload(printerInfo._id, file.name, e.loaded, e.total);
        setTimeout(() => {
          FileManager.createUpload(printerInfo._id, file.name, e.loaded, e.total);
        }, 5000);
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
          UI.createAlert(
            "success",
            `${file.name} has finished uploading to Printer: ${printerInfo.printerName}`,
            3000,
            "clicked"
          );
          setTimeout(async () => {
            let updatePrinter = await OctoFarmClient.post("printers/printerInfo", {
              i: printerInfo._id
            });
            updatePrinter = await updatePrinter.json();
            FileManager.refreshFiles(updatePrinter, spinnerIcon);
            setTimeout(async () => {
              let updatePrinter = await OctoFarmClient.post("printers/printerInfo", {
                i: printerInfo._id
              });
              updatePrinter = await updatePrinter.json();
              FileManager.refreshFiles(updatePrinter, spinnerIcon);
              setTimeout(async () => {
                let updatePrinter = await OctoFarmClient.post("printers/printerInfo", {
                  i: printerInfo._id
                });
                updatePrinter = await updatePrinter.json();
                FileManager.refreshFiles(updatePrinter, "");
              }, 5000);
            }, 5000);
          }, 5500);
        } else {
          fileUploads.remove();
          const fileCounts = document.getElementById(`fileCounts-${index}`);
          if (fileCounts && fileCounts.innerHTML == 1) {
            fileCounts.innerHTML = ` ${0}`;
          }
          resolve(xhr.response);
          UI.createAlert(
            "error",
            `Sorry but ${file.name} could not be uploaded... is CORS enabled and OctoPrint online?`,
            3000,
            "clicked"
          );
        }
      };
      xhr.onerror = function () {
        resolve(xhr.response);
        UI.createAlert(
          "error",
          `Sorry but ${file.name} could not be uploaded... is CORS enabled and OctoPrint online?`,
          3000,
          ""
        );
      };
      if (file.name.includes(".gcode")) {
        xhr.send(formData);
      } else {
        UI.createAlert(
          "error",
          `Sorry but ${file.name} is not a gcode file, could not be uploading.`,
          3000,
          ""
        );
      }
    });
  }

  static actionBtnGate(printer, btn) {
    const data = btn.split("*");
    const action = data[1];
    const filePath = data[2];
    if (action === "fileActionStart") {
      FileActions.startPrint(printer, filePath);
    } else if (action === "fileActionSelect") {
      FileActions.selectFile(printer, filePath);
    } else if (action === "fileActionUpdate") {
      FileActions.updateFile(printer, btn, filePath);
    } else if (action === "fileActionMove") {
      FileActions.moveFile(printer, filePath);
    } else if (action === "fileActionDownload") {
    } else if (action === "fileActionDelete") {
      FileActions.deleteFile(printer, filePath);
    } else if (action === "folderActionMove") {
      FileActions.moveFolder(printer, filePath);
    } else if (action === "folderActionDelete") {
      FileActions.deleteFolder(printer, filePath);
    }
  }

  static async reSyncFiles(e, printer) {
    e.target.innerHTML = "<i class='fas fa-sync fa-spin'></i> Re-Syncing...";
    const done = await OctoFarmClient.post("printers/resyncFile", {
      i: printer._id
    });
    const how = await done.json();
    const flashReturn = function () {
      e.target.classList = "btn btn-primary mb-0";
      e.target.innerHTML = "<i class='fas fa-sync'></i> Re-Sync";
    };
    if (how) {
      e.target.classList = "btn btn-primary mb-0";
      e.target.innerHTML = "<i class='fas fa-sync'></i> Re-Sync";
      setTimeout(flashReturn, 500);
    } else {
      e.target.classList = "btn btn-primary mb-0";
      e.target.innerHTML = "<i class='fas fa-sync'></i> Re-Sync";
      setTimeout(flashReturn, 500);
    }
    FileManager.updateFileList(printer._id);
  }

  static async updateFileList(index) {
    let printer = await OctoFarmClient.post("printers/printerInfo", {
      i: index
    });
    printer = await printer.json();
    FileSorting.loadSort(printer);
    //FileManager.drawFiles(printer);
    return "done";
  }

  static openFolder(folder, target, printer) {
    const fileBackButtonElement = document.getElementById("fileBackBtn");

    if (typeof target !== "undefined" && target.type === "button") {
      return;
    }
    if (typeof folder !== "undefined") {
      folder = folder.replace("file-", "");

      document.getElementById("currentFolder").innerHTML = `local/${folder}`;
      fileBackButtonElement.disabled = false;
      FileManager.updateFileList(printer._id);
    } else {
      const currentFolder = document.getElementById("currentFolder").innerHTML;
      if (currentFolder != "local") {
        const previousFolder = currentFolder.substring(0, currentFolder.lastIndexOf("/"));
        document.getElementById("currentFolder").innerHTML = previousFolder;
        fileBackButtonElement.disabled = previousFolder === "local";
        FileManager.updateFileList(printer._id);
      } else {
        fileBackButtonElement.disabled = true;
      }
    }
  }

  static async drawFile(file) {
    try {
      const fileElem = document.getElementById(`fileList-${file.index}`);
      let fileDate = new Date(file.uploadDate * 1000);
      const dateString = fileDate.toDateString();
      const timeString = fileDate.toTimeString().substring(0, 8);
      fileDate = `${dateString} ${timeString}`;
      const f = ` <div
            id="file-${file.files.local.path}"
            href="#"
          class="list-group-item list-group-item-action flex-column align-items-start bg-secondary"
            style="display: block;
            padding: 0.7rem 0.1rem;"
            >
            <div class="row">
                <div
                id="fileThumbnail-${file.files.local.path}"
          class="col-lg-2"
            style="display:flex; justify-content:center; align-items:center;"
                >
                <center><i class=\"fas fa-file-code fa-2x\"></i></center>
                </div>
                <div class="col-lg-10">
                <div class="row">
                <div class="col-12">
                <h5 class="mb-1 name">${file.files.local.name.replace("/_/g", " ")}</h5>         
                </div>
                </div>
                <div class="row">
                <div class="col-12">
                <p class="mb-1 float-right">
                  <span title="File specific success / failure rate from OctoPrint" id="fileHistoryRate-${
                    file.files.local.path
                  }"><i class="fas fa-thumbs-up"></i> <i class="fa fa-spinner fa-spin" aria-hidden="true"></i> / <i class="fas fa-thumbs-down"></i> <i class="fa fa-spinner fa-spin" aria-hidden="true"></i></span><br>
                <i class="fas fa-stopwatch"></i> 
                <span class="time" id="fileTime-${file.files.local.path}">
                <i class="fa fa-spinner fa-spin" aria-hidden="true"></i></span> <br> 
                <i class="fas fa-dollar-sign"></i> 
                <span title="Expected Printer Cost" class="cost" id="fileCost-${
                  file.files.local.path
                }">  <i class="fa fa-spinner fa-spin" aria-hidden="true"></i></span>  </span>    <br> 
            <span title="Expected Filament Cost" > </span>

                </p>
                <p class="mb-1 float-left">
                <i class="fas fa-clock"></i><span id="fileDateClean-${
                  file.files.local.path
                }" class="date d-none"> ${file.uploadDate}</span><span id="fileDate-${
        file.files.local.path
      }"> ${fileDate}</span><br>
                <i class="fas fa-hdd"></i><span class="size" id="fileSize-${
                  file.files.local.path
                }">  <i class="fa fa-spinner fa-spin" aria-hidden="true"></i></span> </span> <br>
            <span class="usage" title="Expected Filament Usage/Cost" id="fileTool-${
              file.files.local.path
            }">  <i class="fa fa-spinner fa-spin" aria-hidden="true"></i></span>  </span>
                </p> 
                </div>
                </div>
                </div>
                <div class="col-lg-12">
                <div
          class="d-flex btn-group flex-wrap btn-group-sm"
            role="group"
            aria-label="Basic example"
                >
                <button
            title="Re-Sync File"
            id="${file.index}*fileActionUpdate*${file.files.local.path}"
            role="button"
          class="btn btn-dark"
                >
                <i class="fas fa-sync"></i> Re-Sync
                </button>
                <button           title="Start printing file"
            id="${file.index}*fileActionStart*${
        file.files.local.path
      }" type="button" class="btn btn-success">
          <i class="fas fa-play"></i> Start
              </button>
              <button  title="Select file" id="${file.index}*fileActionSelect*${
        file.files.local.path
      }" type="button" class="btn btn-info">
        <i class="fas fa-file-upload"></i> Select
            </button>
            <button          title="Move file" id="${file.index}*fileActionMove*${
        file.files.local.path
      }" type="button" class="btn btn-warning">
      <i class="fas fa-people-carry"></i> Move
          </button>
          <button          title="Download file" onclick="window.open('${
            file.files.local.refs.download
          }')" type="button" class="btn btn-dark">
    <i class="fas fa-download"></i> Download
        </button>
        <button title="Delete file" id="${file.index}*fileActionDelete*${
        file.files.local.path
      }" type="button" class="btn btn-danger">
  <i class="fas fa-trash-alt"></i> Delete
      </button>
      </div>
      </div>
      </div>
      </div>
      </div>`;
      fileElem.insertAdjacentHTML("afterbegin", f);
      let printer = await OctoFarmClient.post("printers/printerInfo", {
        i: file.index
      });
      printer = await printer.json();
      const fileActionBtns = document.querySelectorAll("[id*='*fileAction']");
      fileActionBtns.forEach((btn) => {
        // Gate Keeper listener for file action buttons
        if (btn.id.includes(printer._id)) {
          btn.addEventListener("click", async (e) => {
            FileManager.actionBtnGate(printer, btn.id);
          });
        }
      });
    } catch (e) {
      console.log(e);
    }
  }

  static async refreshFiles(printer, spinnerIcon) {
    for (let i = 0; i < printer.fileList.fileList.length; i++) {
      const file = printer.fileList.fileList[i];
      let currentFolder = document.getElementById("currentFolder")?.innerHTML;
      if (!currentFolder) {
        // Null-ref is tolerable
        continue;
      }
      if (currentFolder.includes("local/")) {
        currentFolder = currentFolder.replace("local/", "");
      }
      if (file.path === currentFolder) {
        if (document.getElementById(`file-${file.fullPath}`)) {
          let toolInfo = "";
          file.toolUnits.forEach((unit, index) => {
            toolInfo += `<i class="fas fa-weight"></i> ${unit} / <i class="fas fa-dollar-sign"></i> Cost: ${file.toolCosts[index]}<br>`;
          });
          let thumbnail = '<center><i class="fas fa-file-code fa-2x"></i></center>';
          if (typeof file.thumbnail !== "undefined" && file.thumbnail !== null) {
            thumbnail = `<center><img src='${printer.printerURL}/${file.thumbnail}' width="100%"></center>`;
          }
          let fileDate = new Date(file.uploadDate * 1000);
          const dateString = fileDate.toDateString();
          const timeString = fileDate.toTimeString().substring(0, 8);
          fileDate = `${dateString} ${timeString}`;
          document.getElementById("fileHistoryRate-" + file.fullPath).innerHTML =
            spinnerIcon +
            '<i class="fas fa-thumbs-up"></i> 0 / <i class="fas fa-thumbs-down"></i> 0';
          document.getElementById(`fileDate-${file.fullPath}`).innerHTML = ` ${fileDate}`;
          document.getElementById(`fileSize-${file.fullPath}`).innerHTML = ` ${Calc.bytes(
            file.fileSize
          )}`;
          document.getElementById(`fileTool-${file.fullPath}`).innerHTML = ` ${toolInfo}`;
          document.getElementById(`fileTime-${file.fullPath}`).innerHTML = ` ${Calc.generateTime(
            file.expectedPrintTime
          )}`;
          document.getElementById(`fileCost-${file.fullPath}`).innerHTML =
            " " + `Print Cost: ${file.printCost?.toFixed(2)}`;
          document.getElementById(`fileThumbnail-${file.fullPath}`).innerHTML = ` ${thumbnail}`;
          document.getElementById(`fileDateClean-${file.fullPath}`).innerHTML = file.uploadDate;
        }
      }
    }
  }

  static drawFiles(printer, recursive) {
    try {
      const fileElem = document.getElementById(`fileList-${printer._id}`);
      if (fileElem) {
        const { fileList } = printer;
        if (printer.systemChecks.cleaning.file.status === "danger") {
          fileElem.innerHTML = `
            <div class="noStorage  text-center"><i class="fas fa-file-code fa-5x"></i><br><h5>There are no files in local storage...</h5></div>
      `;
        } else {
          fileElem.innerHTML = "";
          let currentFolder = document.getElementById("currentFolder").innerHTML;
          if (currentFolder.includes("local/")) {
            currentFolder = currentFolder.replace("local/", "");
          }

          // then draw folders
          if (fileList.folderList.length > 0) {
            fileList.folderList.forEach((folder) => {
              if (folder.path == currentFolder) {
                fileElem.insertAdjacentHTML(
                  "beforeend",
                  `<a
              id="file-${folder.name}"
              href="#"
              class="list-group-item list-group-item-action flex-column align-items-start bg-dark folderAction"
              style="display: block;
                padding: 0.7rem 0.1rem;"
            >
              <div class="row">
                <div
                  class="col-lg-1"
                  style="display:flex; justify-content:center; align-items:center;"
                >
                  <center><i class="fas fa-folder fa-2x"></i></center>
                </div>
                <div class="col-lg-11">
                  <small class="float-right"
                    ><!--Display file and folder count here eventually--></small
                  >
                  <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1 float-left">
                      ${folder.display}
                    </h5>
                    <div
                      class="float-right btn-group flex-wrap btn-group-sm"
                      role="group"
                      aria-label="Basic example"
                    >
                      <button id="${printer._id}*folderActionMove*${folder.name}" type="button" class="btn btn-warning">
                        <i class="fas fa-people-carry"></i> Move
                      </button>
                      <button id="${printer._id}*folderActionDelete*${folder.name}" type="button" class="btn btn-danger">
                        <i class="fas fa-trash-alt"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </a>
            `
                );
              }
            });
          }

          // Filter out files out of current folder scope
          const currentFileList = fileList.fileList.filter(
            (f) => typeof recursive !== "undefined" || f.path === currentFolder
          );

          // Show empty or filled list
          if (currentFileList.length > 0) {
            currentFileList.forEach((file) => {
              let toolInfo = "";
              file.toolUnits.forEach((unit, index) => {
                toolInfo += `<i class="fas fa-weight"></i> ${unit} / <i class="fas fa-dollar-sign"></i> Cost: ${file.toolCosts[index]}<br>`;
              });
              let thumbnail = '<center><i class="fas fa-file-code fa-2x"></i></center>';
              if (typeof file.thumbnail !== "undefined" && file.thumbnail !== null) {
                thumbnail = `<center><img src='${printer.printerURL}/${file.thumbnail}' width="100%"></center>`;
              }
              let fileDate = new Date(file.uploadDate * 1000);
              const dateString = fileDate.toDateString();
              const timeString = fileDate.toTimeString().substring(0, 8);
              let bgColour = "bg-secondary";
              if (file.last === true) {
                bgColour = "bg-dark-success";
              } else if (file.last === false) {
                bgColour = "bg-dark-failed";
              }
              fileDate = `${dateString} ${timeString}`;
              const f = ` <div
            id="file-${file.fullPath}"
            href="#"
          class="list-group-item list-group-item-action flex-column align-items-start ${bgColour}"
            style="display: block;
            padding: 0.7rem 0.1rem;"
            >
            <div class="row">
                <div
                            id="fileThumbnail-${file.fullPath}"
          class="col-lg-2"
            style="display:flex; justify-content:center; align-items:center;"
                >
                ${thumbnail}
                </div>
                <div class="col-lg-10">
                <div class="row">
                <div class="col-12">
                <h5 class="mb-1 name">${file.display}</h5>         
                <small class="mb-1 name">${file.fullPath}</small>         
                </div>
                </div>
                <div class="row">
                <div class="col-12">
                <p class="mb-1 float-right">
                <span title="File specific success / failure rate from OctoPrint" id="fileHistoryRate-${
                  file.fullPath
                }"><i class="fas fa-thumbs-up"></i> ${
                file.success
              } / <i class="fas fa-thumbs-down"></i> ${file.failed}</span><br>
                <i class="fas fa-stopwatch"></i> 
                <span class="time" id="fileTime-${file.fullPath}">
                    ${Calc.generateTime(file.expectedPrintTime)}</span> <br> 
                <i class="fas fa-dollar-sign"></i> 
                <span title="Expected Printer Cost" class="cost" id="fileCost-${
                  file.fullPath
                }"> Print Cost: ${file.printCost?.toFixed(2)} </span>    <br> 
            <span title="Expected Filament Cost"> </span>

                </p>
                <p class="mb-1 float-left">
                <i class="fas fa-clock"></i><span id="fileDateClean-${
                  file.fullPath
                }" class="date d-none"> ${file.uploadDate}</span><span id="fileDate-${
                file.fullPath
              }"> ${fileDate}</span><br>
                <i class="fas fa-hdd"></i><span class="size" id="fileSize-${
                  file.fullPath
                }"> ${Calc.bytes(file.fileSize)}</span> <br>
            <span class="usage" title="Expected Filament Usage/Cost" id="fileTool-${
              file.fullPath
            }"> ${toolInfo} </span>

                </p> 
                </div>
                </div>
                </div>
                <div class="col-lg-12">
                <div
          class="d-flex btn-group flex-wrap btn-group-sm"
            role="group"
            aria-label="Basic example"
                >
                <button
            title="Re-Sync File"
            id="${printer._id}*fileActionUpdate*${file.fullPath}"
            role="button"
          class="btn btn-dark"
                >
                <i class="fas fa-sync"></i> Re-Sync
                </button>
                <button           title="Start printing file"
            id="${printer._id}*fileActionStart*${
                file.fullPath
              }" type="button" class="btn btn-success">
          <i class="fas fa-play"></i> Start
              </button>
              <button  title="Select file" id="${printer._id}*fileActionSelect*${
                file.fullPath
              }" type="button" class="btn btn-info">
        <i class="fas fa-file-upload"></i> Select
            </button>
            <button          title="Move file" id="${printer._id}*fileActionMove*${
                file.fullPath
              }" type="button" class="btn btn-warning">
      <i class="fas fa-people-carry"></i> Move
          </button>
          <button          title="Download file" onclick="window.open('${
            printer.printerURL
          }/downloads/files/local/${file.fullPath}')" type="button" class="btn btn-dark">
    <i class="fas fa-download"></i> Download
        </button>
        <button title="Delete file" id="${printer.printerURL}*fileActionDelete*${
                file.fullPath
              }" type="button" class="btn btn-danger">
  <i class="fas fa-trash-alt"></i> Delete
      </button>
      </div>
      </div>
      </div>
      </div>
      </div>`;
              fileElem.insertAdjacentHTML("beforeend", f);
            });
          } else {
            fileElem.insertAdjacentHTML("beforeend", "No files to be shown.");
          }

          FileManager.updateListeners(printer);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  static search(id) {
    FileActions.search(id);
  }

  static createFolder(printer) {
    FileActions.createFolder(printer);
  }

  static updateListeners(printer) {
    const fileElem = document.getElementById(`fileList-${printer._id}`);
    dragAndDropEnableMultiplePrinters(fileElem, printer);
    const folders = document.querySelectorAll(".folderAction");
    folders.forEach((folder) => {
      folder.addEventListener("click", (e) => {
        // Remove from UI
        FileManager.openFolder(folder.id, e.target, printer);
      });
    });
    const fileActionBtns = document.querySelectorAll("[id*='*fileAction']");
    fileActionBtns.forEach((btn) => {
      // Gate Keeper listener for file action buttons
      btn.addEventListener("click", (e) => {
        FileManager.actionBtnGate(printer, btn.id);
      });
    });
    const folderActionBtns = document.querySelectorAll("[id*='*folderAction']");
    folderActionBtns.forEach((btn) => {
      // Gate Keeper listener for file action buttons
      btn.addEventListener("click", (e) => {
        FileManager.actionBtnGate(printer, btn.id);
      });
    });
  }

  static async multiUpload() {
    let selectedPrinters = null;
    let selectedFolder = "";
    let printAfterUpload = false;
    let selectedFile = null;
    await PrinterSelect.create(document.getElementById("multiPrintersSection"));

    function first() {
      // let boxs = document.querySelectorAll('*[id^="multiUpPrinters-"]');
      // selectedPrinters = [].filter.call(boxs, function(el) {
      //   return el.checked;
      // });

      // if (selectedPrinters.length < 2) {
      //   UI.createAlert(
      //     "error",
      //     "Please select MORE than " + selectedPrinters.length + " printer(s)!",
      //     2000,
      //     "clicked"
      //   );
      //   return;
      // }
      document.getElementById("multiPrinterBtn").disabled = true;
      document.getElementById("multiFolder").disabled = false;
      document.getElementById("multiPrintersSection").classList.add("hidden");
      document.getElementById("multiFolderSection").classList.remove("hidden");
      document.getElementById("multiUploadFooter").innerHTML =
        '<button id="multiUpSubmitBtn" type="button" class="btn btn-warning float-right">Next</button>';
      document.getElementById("multiUpSubmitBtn").addEventListener("click", (e) => {
        second();
      });
      document.getElementById("multiSelectedPrinters").innerHTML = "";
    }

    async function second() {
      // DELETE WHEN FOLDERS WORKING
      selectedPrinters = PrinterSelect.getSelected();
      if (selectedPrinters.length < 2) {
        UI.createAlert(
          "error",
          `Please select MORE than ${selectedPrinters.length} printer(s)!`,
          2000,
          "clicked"
        );
        return;
      }

      document.getElementById("multiPrinterBtn").disabled = true;
      document.getElementById("multiFolder").disabled = false;
      document.getElementById("multiPrintersSection").classList.add("hidden");
      document.getElementById("multiFolderSection").classList.remove("hidden");
      document.getElementById("multiUploadFooter").innerHTML =
        '<button id="multiUpSubmitBtn" type="button" class="btn btn-warning float-right">Next</button>';
      document.getElementById("multiUpSubmitBtn").addEventListener("click", (e) => {
        second();
      });

      document.getElementById("multiSelectedPrinters2").innerHTML = "";
      let printers = await OctoFarmClient.post("printers/printerInfo", {
        i: null
      });
      printers = await printers.json();

      selectedPrinters.forEach((printer, index) => {
        if (printer) {
          const i = _.findIndex(printers, function (o) {
            return o._id == printer.value.toString();
          });
          const name = printers[i].printerName;

          document.getElementById("multiSelectedPrinters2").insertAdjacentHTML(
            "beforeend",
            `
            [<span class="MultiSelected">${name}</span>]
            `
          );
          selectedPrinters[index] = {
            value: printers[i]._id,
            printerInfo: printers[i]
          };
        }
      });
      document.getElementById("multiFolder").disabled = true;
      document.getElementById("multiFile").disabled = false;
      document.getElementById("multiFileSection").classList.remove("hidden");
      document.getElementById("multiFolderSection").classList.add("hidden");
      document.getElementById("multiUploadFooter").innerHTML =
        '<button id="multiUpSubmitBtn" type="button" class="btn btn-success float-right" data-dismiss="modal">Start!</button>';
      document.getElementById("multiUpSubmitBtn").addEventListener("click", (e) => {
        third();
      });
      selectedFolder = document.getElementById("multiNewFolder").value;
      if (selectedFolder != "") {
        selectedFolder += "";
      }
      document.getElementById("printOnLoadBtn").addEventListener("click", (e) => {
        let state = null;
        state = e.target.checked;
        const fileBtn = document.getElementById("multiFileUploadBtn");
        const fileBtnLabel = document.getElementById("multiFileUploadBtnLabel");
        if (state) {
          fileBtn.removeAttribute("multiple", "");
          fileBtn.setAttribute("single", "");
          fileBtnLabel.innerHTML = '<i class="fas fa-file-import"></i> Upload File';
          printAfterUpload = true;
        } else {
          fileBtn.setAttribute("multiple", "");
          fileBtn.removeAttribute("single", "");
          fileBtnLabel.innerHTML = '<i class="fas fa-file-import"></i> Upload Files';
          printAfterUpload = false;
        }
      });
      document.getElementById("multiFileUploadBtn").addEventListener("change", function () {
        grabFiles(this.files);
      });
    }

    function third() {
      if (selectedFolder == "") {
        selectedFolder = "local";
      }

      selectedPrinters.forEach((printer) => {
        const spinner = document.getElementById("fileUploadCountSpinner");
        if (spinner.classList.contains("fa-spin")) {
        } else {
          spinner.classList = "fas fa-spinner fa-spin";
        }
        selectedFile.forEach((file) => {
          const newObject = {};
          const num = printer.value;
          newObject.file = file;
          newObject.index = num;
          newObject.printerInfo = printer.printerInfo;
          newObject.upload = FileManager.fileUpload;
          newObject.currentFolder = selectedFolder;
          console.log(printAfterUpload);
          if (printAfterUpload) {
            newObject.print = true;
          }

          fileUploads.add(newObject);
        });
      });
    }

    function grabFiles(Afiles) {
      Afiles = [...Afiles];
      selectedFile = Afiles;
      const files = document.getElementById("multiFileSelectedNow");
      files.innerHTML = "";
      selectedFile.forEach((file) => {
        files.insertAdjacentHTML(
          "beforeend",
          `
          <li>${file.name}</li>
        `
        );
      });
    }

    const files = document.getElementById("multiFileSelectedNow");
    files.innerHTML = "";
    document.getElementById("multiPrinterBtn").disabled = false;
    document.getElementById("multiFolder").disabled = true;
    document.getElementById("multiFile").disabled = true;
    document.getElementById("multiPrintersSection").classList.remove("hidden");
    document.getElementById("multiFolderSection").classList.add("hidden");
    document.getElementById("multiFileSection").classList.add("hidden");
    document.getElementById("multiUploadFooter").innerHTML =
      '<button id="multiUpSubmitBtn" type="button" class="btn btn-warning float-right">Next</button>';
    document.getElementById("multiUpSubmitBtn").addEventListener("click", (e) => {
      second();
    });
  }
}

export class FileActions {
  static async search(id) {
    let printer = await OctoFarmClient.post("printers/printerInfo", {
      i: id
    });
    printer = await printer.json();

    const fileList = document.getElementById(`fileList-${id}`);
    let input = document.getElementById("searchFiles").value.toUpperCase();
    input = input.replace(/ /g, "_");
    if (input === "") {
      // No search term so reset view
      document.getElementById("currentFolder").value = "local/";
      FileSorting.loadSort(printer);
      //FileManager.drawFiles(printer, "Recursive");
    } else {
      document.getElementById("currentFolder").value = "local/";
      FileSorting.loadSort(printer, "recursive");
      //FileManager.drawFiles(printer, "Recursive");
    }
    const button = fileList.querySelectorAll('*[id^="file-"]');
    for (let i = 0; i < button.length; i++) {
      const file = button[i].id.replace("file-", "");

      if (file.toUpperCase().indexOf(input) > -1) {
        button[i].style.display = "";
      } else {
        button[i].style.display = "none";
      }
    }
  }

  static async createFolder(printer) {
    let currentFolder = document.getElementById("currentFolder").innerHTML;
    const formData = new FormData();

    if (currentFolder === "local") {
      currentFolder = "";
    } else if (currentFolder.includes("local/")) {
      currentFolder = currentFolder.replace("local/", "");
    }

    bootbox.prompt("What would you like to name your folder?", async function (result) {
      if (result) {
        formData.append("foldername", result);
        formData.append("path", `${currentFolder}/`);
        const post = await OctoPrintClient.folder(printer, "local", formData);
        if (post.status === 201 || post.status === 200) {
          const opts = {
            i: printer._id,
            foldername: result,
            path: currentFolder
          };
          const update = await OctoFarmClient.post("printers/newFolder", opts);
          UI.createAlert("success", "Successfully created your new folder...", 3000, "clicked");
          FileManager.updateFileList(printer._id);
        } else {
          UI.createAlert("error", "Sorry your folder couldn't be saved...", 3000, "clicked");
        }
      }
    });
  }

  // Needs updating when filament is brought in.
  static grabUsage(file) {
    if (typeof file.length === "undefined") {
      if (file.length === null || file.length.length === 0) {
        return "No Length";
      }
      return "No Length";
    }
    const usageArray = {
      totalLength: [],
      totalGrams: [],
      usage: []
    };
    file.length.forEach((length) => {
      const radius = parseFloat(1.75) / 2;
      const volume = (length / 1000) * Math.PI * radius * radius;
      const usage = volume * parseFloat(1.24);
      usageArray.totalLength.push(length / 1000);
      usageArray.totalGrams.push(usage);
      usageArray.usage.push(`${(length / 1000).toFixed(2)}m / ${usage.toFixed(2)}g`);
    });
    usageArray.totalLength = usageArray.totalLength.reduce((a, b) => a + b, 0);
    usageArray.totalGrams = usageArray.totalGrams.reduce((a, b) => a + b, 0);
    return usageArray;
  }

  static async startPrint(printer, filePath) {
    const opts = {
      command: "start"
    };
    let loadFile = await OctoPrintClient.file(printer, filePath, "load");
    if (loadFile) {
      OctoPrintClient.jobAction(printer, opts);
    } else {
      UI.createAlert("error", "Could not select file", 3000, "clicked");
    }
  }

  static selectFile(printer, filePath) {
    OctoPrintClient.file(printer, filePath, "load");
  }

  static async updateFile(printer, btn, fullPath) {
    const refreshBtn = document.getElementById(btn);
    const btnName = null;
    refreshBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Refreshing...';
    const done = await OctoFarmClient.post("printers/resyncFile", {
      i: printer._id,
      fullPath
    });
    const how = await done.json();
    FileManager.updateFileList(printer._id);
    refreshBtn.innerHTML = '<i class="fas fa-sync"></i> Refresh';
    const flashReturn = function () {
      refreshBtn.classList = "btn btn-dark";
    };
    if (how) {
      refreshBtn.classList = "btn btn-sm btn-success";
      setTimeout(flashReturn, 500);
    } else {
      refreshBtn.classList = "btn btn-sm btn-danger";
      setTimeout(flashReturn, 500);
    }
  }

  static moveFile(printer, fullPath) {
    const inputOptions = [];
    const loc = {
      text: "local",
      value: "/"
    };
    inputOptions.push(loc);
    printer.fileList.folderList.forEach((folder) => {
      const option = {
        text: folder.name,
        value: folder.name
      };
      inputOptions.push(option);
    });
    bootbox.prompt({
      title: "Where would you like to move the file?",
      inputType: "select",
      inputOptions,
      async callback(result) {
        if (result) {
          const opt = {
            command: "move",
            destination: result
          };
          const post = await OctoPrintClient.post(printer, `files/local/${fullPath}`, opt);
          if (post.status === 404) {
            UI.createAlert(
              "error",
              "We could not find the location, does it exist?",
              3000,
              "clicked"
            );
          } else if (post.status === 409) {
            UI.createAlert(
              "error",
              "There was a conflict, file already exists or is in use...",
              3000,
              "clicked"
            );
          } else {
            const json = await post.json();
            const opts = {
              index: printer._id,
              newPath: result,
              fileName: json.name,
              newFullPath: json.path
            };
            UI.createAlert("warning", "Moving file... please wait.", 3000, "clicked");
            const updateFarm = await OctoFarmClient.post("printers/moveFile", opts);
            setTimeout(function () {
              FileManager.updateFileList(printer._id);
              UI.createAlert("success", "Successfully moved your file...", 3000, "clicked");
            }, 3000);
          }
        }
      }
    });
  }

  static deleteFile(printer, fullPath) {
    bootbox.confirm({
      message: `Are you sure you want to delete ${fullPath}?`,
      buttons: {
        cancel: {
          label: '<i class="fa fa-times"></i> Cancel'
        },
        confirm: {
          label: '<i class="fa fa-check"></i> Confirm'
        }
      },
      async callback(result) {
        if (result) {
          await OctoPrintClient.file(printer, fullPath, "delete");
          document.getElementById(`file-${fullPath}`).remove();
        }
      }
    });
  }

  static deleteFolder(printer, fullPath) {
    bootbox.confirm({
      message: `Are you sure you want to delete ${fullPath}?`,
      buttons: {
        cancel: {
          label: '<i class="fa fa-times"></i> Cancel'
        },
        confirm: {
          label: '<i class="fa fa-check"></i> Confirm'
        }
      },
      async callback(result) {
        const opts = {
          index: printer._id,
          fullPath
        };
        if (result) {
          const post = await OctoPrintClient.delete(printer, `files/local/${fullPath}`);
          const del = await OctoFarmClient.post("printers/removefolder", opts);
          document.getElementById(`file-${fullPath}`).remove();
        }
      }
    });
  }

  static moveFolder(printer, fullPath) {
    const inputOptions = [];
    const loc = {
      text: "local",
      value: "/"
    };
    inputOptions.push(loc);
    printer.fileList.folderList.forEach((folder) => {
      const option = {
        text: folder.name,
        value: folder.name
      };
      inputOptions.push(option);
    });
    bootbox.prompt({
      title: "Where would you like to move the file?",
      inputType: "select",
      inputOptions,
      async callback(result) {
        if (result) {
          const opt = {
            command: "move",
            destination: result
          };

          const post = await OctoPrintClient.post(printer, `files/local/${fullPath}`, opt);
          if (post.status === 404) {
            UI.createAlert(
              "error",
              "We could not find the location, does it exist?",
              3000,
              "clicked"
            );
          } else if (post.status === 409) {
            UI.createAlert(
              "error",
              "There was a conflict, file already exists or is in use...",
              3000,
              "clicked"
            );
          } else {
            const json = await post.json();
            const opts = {
              index: printer._id,
              oldFolder: fullPath,
              newFullPath: result,
              folderName: json.path
            };
            UI.createAlert("warning", "Moving folder please wait...", 3000, "clicked");
            const updateFarm = await OctoFarmClient.post("printers/moveFolder", opts);
            setTimeout(function () {
              FileManager.updateFileList(printer._id);
              UI.createAlert("success", "Successfully moved your file...", 3000, "clicked");
            }, 3000);
          }
        }
      }
    });
  }
}
