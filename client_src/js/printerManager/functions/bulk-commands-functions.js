import { findIndex } from "lodash";

import OctoFarmClient from "../../lib/octofarm_client.js";
import UI from "../../lib/functions/ui";
import PrinterSelect from "../../lib/modules/printerSelect";
import {
  octoPrintPluginInstallAction,
  updateOctoPrintPlugins
} from "../../octoprint/octoprint-plugin-commands";
import {
  disconnectPrinterFromOctoPrint,
  quickConnectPrinterToOctoPrint,
  sendPowerCommandToOctoPrint,
  updateOctoPrintClient
} from "../../octoprint/octoprint-client-commands";
import {
  printerPreHeatBed,
  printerPreHeatTool,
  printerPreHeatChamber,
  printerStartPrint,
  printerPausePrint,
  printerRestartPrint,
  printerResumePrint,
  printerStopPrint,
  printerMoveAxis,
  printerHomeAxis,
  printerSendGcode
} from "../../octoprint/octoprint-printer-commands";
import CustomGenerator from "../../lib/modules/customScripts";
import { setupPluginSearch } from "./plugin-search.function";
import { returnPluginListTemplate } from "../templates/octoprint-plugin-list.template";

// TODO this should come from printer select to save the extra call, re-iteration and matching.
async function getCurrentlySelectedPrinterList() {
  try {
    const currentPrinterList = await OctoFarmClient.post(
      "printers/printerInfo"
    );
    const matchedPrinters = [];
    //Grab all check boxes
    const selectedPrinters = PrinterSelect.getSelected();
    selectedPrinters.forEach((element) => {
      const printerID = element.id.split("-");
      const index = findIndex(currentPrinterList, function (o) {
        return o._id == printerID[1];
      });
      if (index > -1) {
        matchedPrinters.push(currentPrinterList[index]);
      }
    });
    return matchedPrinters;
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Couldn't get selected printer list: ${e}`,
      0,
      "clicked"
    );
    return [];
  }
}

export async function bulkOctoPrintPluginUpdate() {
  try {
    let currentPrinterList = await OctoFarmClient.post(
      "printers/printerInfo",
      {}
    );
    let message = "";
    let toUpdate = [];
    let pluginList = [];
    for (let printer = 0; printer < currentPrinterList.length; printer++) {
      let currentPrinter = currentPrinterList[printer];
      if (currentPrinter.octoPrintPluginUpdates.length > 0) {
        message += currentPrinter.printerName + "<br>";
        toUpdate.push({
          printerURL: currentPrinter.printerURL,
          printerName: currentPrinter.printerName,
          apikey: currentPrinter.apikey
        });
        for (
          let plugin = 0;
          plugin < currentPrinter.octoPrintPluginUpdates.length;
          plugin++
        ) {
          let currentPlugin = currentPrinter.octoPrintPluginUpdates[plugin];
          pluginList.push(currentPlugin.id);
        }
      }
    }
    message += "Are you sure?";
    bootbox.confirm({
      size: "medium",
      title: "This will update the following printers plugins...",
      message: message,
      callback: async function (result) {
        if (result) {
          for (let i = 0; i < toUpdate.length; i++) {
            await updateOctoPrintPlugins(pluginList, toUpdate[i]);
          }
        }
      }
    });
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Encountered and error whilst trying to update your plugins: ${e}`,
      0,
      "clicked"
    );
  }
}

export async function bulkOctoPrintClientUpdate() {
  try {
    let currentPrinterList = await OctoFarmClient.post("printers/printerInfo");
    let message = "";
    let toUpdate = [];
    for (let printer = 0; printer < currentPrinterList.length; printer++) {
      let currentPrinter = currentPrinterList[printer];
      if (currentPrinter.octoPrintUpdate.updateAvailable) {
        message += currentPrinter.printerName + "<br>";

        toUpdate.push({
          printerURL: currentPrinter.printerURL,
          printerName: currentPrinter.printerName,
          apikey: currentPrinter.apikey
        });
      }
    }

    message += "Are you sure?";
    bootbox.confirm({
      size: "medium",
      title: "This will update the following OctoPrint Installs...",
      message: message,
      callback: async function (result) {
        if (result) {
          for (let i = 0; i < toUpdate.length; i++) {
            await updateOctoPrintClient(toUpdate[i]);
          }
        }
      }
    });
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Encountered and error whilst trying to update your OctoPrint Clients: ${e}`,
      0,
      "clicked"
    );
  }
}

export async function bulkConnectPrinters() {
  const printersToControl = await getCurrentlySelectedPrinterList();
  for (let p = 0; p < printersToControl.length; p++) {
    await quickConnectPrinterToOctoPrint(printersToControl[p]);
  }
}

export async function bulkDisconnectPrinters() {
  const printersToDisconnect = await getCurrentlySelectedPrinterList();
  console.log(printersToDisconnect);
  for (let p = 0; p < printersToDisconnect.length; p++) {
    await disconnectPrinterFromOctoPrint(printersToDisconnect[p]);
  }
}

export function bulkOctoPrintPowerCommand() {
  bootbox.prompt({
    title: "Power command!",
    message: "<p>Please select an option below:</p>",
    inputType: "radio",
    inputOptions: [
      {
        text: "Restart OctoPrint",
        value: "restart"
      },
      {
        text: "Reboot Host",
        value: "reboot"
      },
      {
        text: "Shutdown Host",
        value: "shutdown"
      }
    ],
    callback: async function (result) {
      const printersToPower = await getCurrentlySelectedPrinterList();
      for (let p = 0; p < printersToPower.length; p++) {
        await sendPowerCommandToOctoPrint(printersToPower[p], result);
      }
    }
  });
}

export function bulkOctoPrintPreHeatCommand() {
  bootbox.dialog({
    title: "Bulk printer heating...",
    message: `
        <form class="form-inline">
           <div class="input-group mb-3">
            <div class="input-group-prepend">
              <label class="input-group-text" for="preHeatToolSelect">Tool #: </label>
            </div>
            <select class="custom-select" id="preHeatToolSelect">
              <option selected value="0">0</option>
              <option value="0">1</option>
              <option value="0">2</option>
              <option value="0">3</option>
              <option value="0">4</option>
            </select>
          </div>
          <div class="input-group mb-3">
            <input type="text" class="form-control" placeholder="0" aria-label="0" aria-describedby="basic-addon1" id="preHeatToolTempSelect">
            <div class="input-group-append">
              <span class="input-group-text" id="basic-addon1">°C</span>
            </div>
          </div>
          <p>&nbsp;</p>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text" id="basic-addon1">Bed</span>
            </div>
            <input type="text" class="form-control" placeholder="0" aria-label="0" aria-describedby="basic-addon1" id="preHeatBedTempSelect">
            <div class="input-group-append">
              <span class="input-group-text" id="basic-addon1">°C</span>
            </div>
          </div>
          <p>&nbsp;</p>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text" id="basic-addon1">Chamber</span>
            </div>
            <input type="text" class="form-control" placeholder="0" aria-label="0" aria-describedby="basic-addon1" id="preHeatChamberTempSelect">
                  <div class="input-group-append">
              <span class="input-group-text" id="basic-addon1">°C</span>
            </div>
          </div>
        </form>
        `,
    size: "large",
    onEscape: true,
    backdrop: true,
    closeButton: true,
    buttons: {
      action: {
        label: '<i class="fas fa-fire"></i> Heat!',
        className: "btn-success",
        callback: async function () {
          let toolNumber = document.getElementById("preHeatToolSelect");
          let toolTemp = document.getElementById("preHeatToolTempSelect");
          let bedTemp = document.getElementById("preHeatBedTempSelect");
          let chamberTemp = document.getElementById("preHeatChamberTempSelect");

          const printersToPreHeat = await getCurrentlySelectedPrinterList();
          for (let p = 0; p < printersToPreHeat.length; p++) {
            await printerPreHeatTool(
              printersToPreHeat[p],
              toolTemp,
              toolNumber
            );
            await printerPreHeatBed(printersToPreHeat[p], bedTemp);
            await printerPreHeatChamber(printersToPreHeat[p], chamberTemp);
          }
        }
      }
    }
  });
}

export async function bulkOctoPrintControlCommand() {
  const printersToControl = await getCurrentlySelectedPrinterList();
  let cameraBlock = "";

  printersToControl.forEach((printer) => {
    cameraBlock += `
        <div class="col-lg-3">
            <img width="100%" src="${printer.cameraURL}">
        </div>
        `;
  });

  bootbox.dialog({
    title: "Bulk printer control...",
    message: `
      <div id="printerControls" class="row">
            <div class="col-lg-12">
              <div class="row">
                 ${cameraBlock}
              </div>
            </div>
            <div class="col-md-6">
                            <div class="row">
                    <div class="col-9">
                        <center>
                            <h5>X/Y</h5>
                        </center>
                        <hr>
                    </div>
                    <div class="col-3">
                        <center>
                            <h5>Z</h5>
                        </center>
                        <hr>
                    </div>
                </div>
                <div class="row">
                    <div class="col-3"></div>
                    <div class="col-3">
                        <center><button id="pcYpos" type="button" class="btn btn-light"><i class="fas fa-arrow-up"></i></button></center>
                    </div>
                    <div class="col-3"></div>
                    <div class="col-3">
                        <center><button id="pcZpos" type="button" class="btn btn-light"><i class="fas fa-arrow-up"></i></button></center>
                    </div>
                </div>
                <div class="row">
                    <div class="col-3">
                        <center><button id="pcXneg" type="button" class="btn btn-light"><i class="fas fa-arrow-left"></i></button></center>
                    </div>
                    <div class="col-3">
                        <center><button id="pcXYhome" type="button" class="btn btn-light"><i class="fas fa-home"></i></button></center>
                    </div>
                    <div class="col-3">
                        <center><button id="pcXpos" type="button" class="btn btn-light"><i class="fas fa-arrow-right"></i></button></center>
                    </div>
                    <div class="col-3">
                        <center><button id="pcZhome" type="button" class="btn btn-light"><i class="fas fa-home"></i></button></center>
                    </div>
                </div>
                <div class="row">
                    <div class="col-3"></div>
                    <div class="col-3">
                        <center><button id="pcYneg" type="button" class="btn btn-light"><i class="fas fa-arrow-down"></i></button></center>
                    </div>
                    <div class="col-3"></div>
                    <div class="col-3">
                        <center><button id="pcZneg" type="button" class="btn btn-light"><i class="fas fa-arrow-down"></i></button></center>
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <center>
                            <div id="pcAxisSteps" class="btn-group" role="group">
                                <button id="pcAxisSteps01" type="button" class="btn btn-light" value="01">0.1</button>
                                <button id="pcAxisSteps1" type="button" class="btn btn-light" value="1">1</button>
                                <button id="pcAxisSteps10" type="button" class="btn btn-dark active" value="10">10</button>
                                <button id="pcAxisSteps100" type="button" class="btn btn-light" value="100">100</button>
                            </div>
                        </center>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
            <center>
            <button id="pmPrintStart" type="button" class="btn btn-success mb-1" role="button" style="display: inline-block;"><i class="fas fa-print"></i> Print</button> <br>
            <button id="pmPrintPause" type="button" class="btn btn-light mb-1" role="button" style="display: inline-block;"><i class="fas fa-pause"></i> Pause</button> <br>
            <button id="pmPrintRestart" type="button" class="btn btn-warning mb-1" role="button"  style="display: inline-block;"><i class="fas fa-undo"></i> Restart</button> <br>
            <button id="pmPrintResume" type="button" class="btn btn-info mb-1" role="button"  style="display: inline-block;"><i class="fas fa-redo"></i> Resume</button> <br>
            <button id="pmPrintStop" type="button" class="btn btn-danger mb-1" style="display: inline-block;"><i class="fas fa-square"></i> Cancel</button> <br>
            </center>
            </div>
        `,
    size: "large",
    onEscape: true,
    backdrop: true,
    closeButton: true,
    onShow: function (e) {
      //Grab Page
      const printerControls = {
        xPlus: document.getElementById("pcXpos"),
        xMinus: document.getElementById("pcXneg"),
        yPlus: document.getElementById("pcYpos"),
        yMinus: document.getElementById("pcYneg"),
        xyHome: document.getElementById("pcXYhome"),
        zPlus: document.getElementById("pcZpos"),
        zMinus: document.getElementById("pcZneg"),
        zHome: document.getElementById("pcZhome"),
        step01: document.getElementById("pcAxisSteps01"),
        step1: document.getElementById("pcAxisSteps1"),
        step10: document.getElementById("pcAxisSteps10"),
        step100: document.getElementById("pcAxisSteps100"),
        printStart: document.getElementById("pmPrintStart"),
        printPause: document.getElementById("pmPrintPause"),
        printRestart: document.getElementById("pmPrintRestart"),
        printResume: document.getElementById("pmPrintResume"),
        printStop: document.getElementById("pmPrintStop")
      };
      printerControls.printStart.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerStartPrint(printer, e);
        });
      });
      printerControls.printPause.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerPausePrint(printer, e);
        });
      });
      printerControls.printRestart.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerRestartPrint(printer, e);
        });
      });
      printerControls.printResume.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerResumePrint(printer, e);
        });
      });
      printerControls.printStop.addEventListener("click", (e) => {
        bootbox.confirm({
          message: "Are you sure you want to cancel all of your ongoing print?",
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
              printersToControl.forEach((printer) => {
                printerStopPrint(printer, e);
              });
            }
          }
        });
      });

      printerControls.xPlus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "x");
        });
      });
      printerControls.xMinus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "x", "-");
        });
      });
      printerControls.yPlus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "y");
        });
      });
      printerControls.yMinus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "y", "-");
        });
      });
      printerControls.xyHome.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerHomeAxis(e, printer, ["x", "y"]);
        });
      });
      printerControls.zPlus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "z");
        });
      });
      printerControls.zMinus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "z", "-");
        });
      });
      printerControls.zHome.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerHomeAxis(e, printer, ["z"]);
        });
      });
      printerControls.step01.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.post("printers/stepChange", {
            printer: printer._id,
            newSteps: "01"
          });
        });

        printerControls.step01.className = "btn btn-dark active";
        printerControls.step1.className = "btn btn-light";
        printerControls.step10.className = "btn btn-light";
        printerControls.step100.className = "btn btn-light";
      });
      printerControls.step1.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.post("printers/stepChange", {
            printer: printer._id,
            newSteps: "1"
          });
        });

        printerControls.step1.className = "btn btn-dark active";
        printerControls.step01.className = "btn btn-light";
        printerControls.step10.className = "btn btn-light";
        printerControls.step100.className = "btn btn-light";
      });
      printerControls.step10.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.post("printers/stepChange", {
            printer: printer._id,
            newSteps: "10"
          });
        });

        printerControls.step10.className = "btn btn-dark active";
        printerControls.step1.className = "btn btn-light";
        printerControls.step01.className = "btn btn-light";
        printerControls.step100.className = "btn btn-light";
      });
      printerControls.step100.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.post("printers/stepChange", {
            printer: printer._id,
            newSteps: "100"
          });
        });

        printerControls.step100.className = "btn btn-dark active";
        printerControls.step1.className = "btn btn-light";
        printerControls.step10.className = "btn btn-light";
        printerControls.step01.className = "btn btn-light";
      });
    }
  });
}

export async function bulkOctoPrintGcodeCommand() {
  const printersToSendGcode = await getCurrentlySelectedPrinterList();

  bootbox.prompt({
    size: "large",
    title: "What gcode commands would you like sent?",
    inputType: "textarea",
    onShow: function (e) {
      let textArea = document.getElementsByClassName(
        "bootbox-input bootbox-input-textarea form-control"
      );
      const customGcodeEE =
        "<div class='mb-1' id='customGcodeCommandsArea'></div>";
      textArea[0].insertAdjacentHTML("beforebegin", customGcodeEE);
      let buttonPrinters = [];
      printersToConnect.forEach(async (printer) => {
        const index = _.findIndex(printerInfo, function (o) {
          return o._id === printer;
        });
        if (index > -1) {
          buttonPrinters.push(printerInfo[index]);
        }
      });
      CustomGenerator.generateButtons(buttonPrinters);
    },
    callback: async function (result) {
      if (result !== null) {
        for (let p = 0; p < printersToSendGcode.length; p++) {
          await printerSendGcode(printersToSendGcode[p]);
        }
      }
    }
  });
}

export async function bulkOctoPrintPluginAction(action) {
  const printersForPluginAction = await getCurrentlySelectedPrinterList();
  try {
    let pluginList = [];
    let printerPluginList = null;
    if (action === "install") {
      printerPluginList = await OctoFarmClient.get(
        "printers/pluginList/" + printersForPluginAction[0]._id
      );
    } else {
      printerPluginList = await OctoFarmClient.get("printers/pluginList/all");
    }
    printerPluginList.forEach((plugin) => {
      if (action === "install") {
        pluginList.push({
          text: returnPluginListTemplate(plugin),
          value: plugin.archive
        });
      } else {
        pluginList.push({
          text: returnPluginListTemplate(plugin),
          value: plugin.id
        });
      }
    });
    pluginList = _.sortBy(pluginList, [
      function (o) {
        return o.text;
      }
    ]);

    //Install Promt
    bootbox.prompt({
      size: "large",
      title: `<form class="form-inline float-right">
                  <div class="form-group">
                    <label for="searchPlugins">
                      Please choose the plugin you'd like to install... or: &nbsp;
                    </label>
                    <input width="50%" id="searchPlugins" type="text" placeholder="Type your plugin name here..." class="search-control search-control-underlined">
                  </div>
                </form>`,
      inputType: "checkbox",
      multiple: true,
      inputOptions: pluginList,
      scrollable: true,
      onShow: function (e) {
        setupPluginSearch();
      },
      callback: async function (result) {
        if (result) {
          let trackerBtn = document.getElementById("pluginTracking");
          trackerBtn.classList.remove("d-none");
          let pluginAmount = result.length * printersForPluginAction.length;
          let cleanAction = action.charAt(0).toUpperCase() + action.slice(1);
          if (action === "install") {
            cleanAction = cleanAction + "ing";
          }
          trackerBtn.innerHTML = `
                   ${cleanAction} Plugins!<br>
                   <i class="fas fa-print"></i>${printersForPluginAction.length} / <i class="fas fa-plug"></i> ${pluginAmount}
        `;
          for (let p = 0; p < printersForPluginAction.length; p++) {
            await octoPrintPluginInstallAction(
              printersForPluginAction[p],
              result,
              action
            );
            trackerBtn.innerHTML = `
                ${cleanAction} Plugins!<br>
                <i class="fas fa-print"></i>${
                  printersForPluginAction.length - p
                } / <i class="fas fa-plug"></i> ${pluginAmount}
              `;
            pluginAmount = pluginAmount - 1;
          }
          trackerBtn.classList.add("d-none");
        }
      }
    });
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Failed to generate plugin list, please check logs: ${e}`,
      0,
      "clicked"
    );
  }
}
