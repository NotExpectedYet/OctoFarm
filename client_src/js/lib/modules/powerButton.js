import OctoPrintClient from "../octoprint.js";
import OctoFarmclient from "../octofarm.js";

export default class PowerButton {
  static revealBulkPower() {
    let bulkPowerBtn = document.getElementById("bulkPowerBtn");
    if (bulkPowerBtn) {
      if (bulkPowerBtn.classList.contains("d-none")) {
        bulkPowerBtn.classList.remove("d-none");
      }
    }
  }

  static async powerButtons(printer) {
    const divider = document.getElementById("printerDropDownMaker-" + printer._id);
    if (printer.powerSettings.powerOffURL !== "") {
      if (divider.classList.contains("d-none")) {
        divider.classList.remove("d-none");
      }
      const powerOffPrinter = document.getElementById("printerPowerOff-" + printer._id);
      if (powerOffPrinter.classList.contains("d-none")) {
        powerOffPrinter.classList.remove("d-none");
        powerOffPrinter.addEventListener("click", async (event) => {
          bootbox.confirm({
            message: "Are you sure you would like to power down your printer?",
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
            callback: async function (result) {
              if (result) {
                await OctoPrintClient.power(
                  printer,
                  printer.powerSettings.powerOffURL,
                  "Power Off",
                  printer.powerSettings.powerOffCommand
                );
                if (printer.powerSettings.powerStatusURL !== "") {
                  await OctoPrintClient.getPowerStatus(
                    printer,
                    printer.powerSettings.powerStatusURL,
                    printer.powerSettings.powerStatusCommand
                  );
                  await OctoPrintClient.getPowerStatus(
                    printer,
                    printer.powerSettings.powerStatusURL,
                    printer.powerSettings.powerStatusCommand
                  );
                  await OctoPrintClient.getPowerStatus(
                    printer,
                    printer.powerSettings.powerStatusURL,
                    printer.powerSettings.powerStatusCommand
                  );
                }
              }
            }
          });
        });
      }
    }
    if (printer.powerSettings.powerOnURL !== "") {
      if (divider.classList.contains("d-none")) {
        divider.classList.remove("d-none");
      }
      const powerOnnPrinter = document.getElementById("printerPowerOn-" + printer._id);
      if (powerOnnPrinter.classList.contains("d-none")) {
        powerOnnPrinter.classList.remove("d-none");
        powerOnnPrinter.addEventListener("click", async (event) => {
          await OctoPrintClient.power(
            printer,
            printer.powerSettings.powerOnURL,
            "Power On",
            printer.powerSettings.powerOnCommand
          );
          await OctoPrintClient.getPowerStatus(
            printer,
            printer.powerSettings.powerStatusURL,
            printer.powerSettings.powerStatusCommand
          );
          await OctoPrintClient.getPowerStatus(
            printer,
            printer.powerSettings.powerStatusURL,
            printer.powerSettings.powerStatusCommand
          );
          await OctoPrintClient.getPowerStatus(
            printer,
            printer.powerSettings.powerStatusURL,
            printer.powerSettings.powerStatusCommand
          );
        });
      }
    }
    if (printer.powerSettings.powerStatusURL !== "") {
      if (divider.classList.contains("d-none")) {
        divider.classList.remove("d-none");
      }
      const status = await OctoPrintClient.getPowerStatus(
        printer,
        printer.powerSettings.powerStatusURL,
        printer.powerSettings.powerStatusCommand
      );
    }
    if (printer.powerSettings.powerToggleURL !== "") {
      if (divider.classList.contains("d-none")) {
        divider.classList.remove("d-none");
      }
      const powerTogglePrinter = document.getElementById("printerPower-" + printer._id);
      if (powerTogglePrinter) {
        if (powerTogglePrinter.disabled === true) {
          powerTogglePrinter.disabled = false;
          powerTogglePrinter.addEventListener("click", async (event) => {
            if (
              document.getElementById("printerStatus-" + printer._id).style.color === "green" ||
              document.getElementById("printerStatus-" + printer._id).style.color === "black"
            ) {
              bootbox.confirm({
                message: "Are you sure you would like to power down your printer?",
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
                callback: async function (result) {
                  if (result) {
                    const status = await OctoPrintClient.power(
                      printer,
                      printer.powerSettings.powerToggleURL,
                      "Power Toggle",
                      printer.powerSettings.powerToggleCommand
                    );
                    await OctoPrintClient.getPowerStatus(
                      printer,
                      printer.powerSettings.powerStatusURL,
                      printer.powerSettings.powerStatusCommand
                    );
                    await OctoPrintClient.getPowerStatus(
                      printer,
                      printer.powerSettings.powerStatusURL,
                      printer.powerSettings.powerStatusCommand
                    );
                    await OctoPrintClient.getPowerStatus(
                      printer,
                      printer.powerSettings.powerStatusURL,
                      printer.powerSettings.powerStatusCommand
                    );
                  }
                }
              });
            } else {
              const status = await OctoPrintClient.power(
                printer,
                printer.powerSettings.powerToggleURL,
                "Power Toggle",
                printer.powerSettings.powerToggleCommand
              );
              await OctoPrintClient.getPowerStatus(
                printer,
                printer.powerSettings.powerStatusURL,
                printer.powerSettings.powerStatusCommand
              );
              await OctoPrintClient.getPowerStatus(
                printer,
                printer.powerSettings.powerStatusURL,
                printer.powerSettings.powerStatusCommand
              );
              await OctoPrintClient.getPowerStatus(
                printer,
                printer.powerSettings.powerStatusURL,
                printer.powerSettings.powerStatusCommand
              );
            }
          });
        }
      }
    }
  }

  static async applyBtn(printer, element) {
    if (
      typeof printer.otherSettings.system !== "undefined" &&
      !document.getElementById("printerPower-" + printer._id)
    ) {
      if (
        (printer.otherSettings.system.commands.serverRestartCommand !== "" &&
          printer.otherSettings.system.commands.serverRestartCommand !== null) ||
        (printer.otherSettings.system.commands.systemRestartCommand !== "" &&
          printer.otherSettings.system.commands.systemRestartCommand !== null) ||
        (printer.otherSettings.system.commands.systemShutdownCommand !== "" &&
          printer.otherSettings.system.commands.systemShutdownCommand !== null)
      ) {
        document.getElementById(element + printer._id).innerHTML = PowerButton.printerPowerBtn(
          printer._id
        );
        if (
          printer.otherSettings.system.commands.serverRestartCommand !== "" &&
          printer.otherSettings.system.commands.serverRestartCommand !== null
        ) {
          const restartOctoPrint = document.getElementById(
            "printerRestartOctoPrint-" + printer._id
          );
          restartOctoPrint.classList.remove("d-none");
          restartOctoPrint.addEventListener("click", (event) => {
            OctoPrintClient.system(printer, "restart");
          });
        }
        if (
          printer.otherSettings.system.commands.systemRestartCommand !== "" &&
          printer.otherSettings.system.commands.systemRestartCommand !== null
        ) {
          const restartHost = document.getElementById("printerRestartHost-" + printer._id);
          restartHost.classList.remove("d-none");
          restartHost.addEventListener("click", (event) => {
            OctoPrintClient.system(printer, "reboot");
          });
        }

        if (
          printer.otherSettings.system.commands.systemShutdownCommand !== "" &&
          printer.otherSettings.system.commands.systemShutdownCommand !== null
        ) {
          const shutdownHost = document.getElementById("printerShutdownHost-" + printer._id);
          shutdownHost.classList.remove("d-none");
          shutdownHost.addEventListener("click", (event) => {
            OctoPrintClient.system(printer, "shutdown");
          });
        }
      }
    }

    if (printer.powerSettings !== null && !_.isEmpty(printer.powerSettings)) {
      if (printer.powerSettings.powerOnURL !== "") {
        if (!document.getElementById("printerPower-" + printer._id)) {
          if (document.getElementById(element + printer._id)) {
            document.getElementById(element + printer._id).innerHTML = PowerButton.printerPowerBtn(
              printer._id
            );
            PowerButton.powerButtons(printer);
          }
        } else {
          PowerButton.powerButtons(printer);
        }
      }
      if (typeof printer.powerSettings.wol !== "undefined") {
        if (printer.powerSettings.wol.enabled) {
          if (
            printer.powerSettings.wol.ip === "" ||
            printer.powerSettings.wol.port === "" ||
            printer.powerSettings.wol.interval === "" ||
            printer.powerSettings.wol.count === ""
          ) {
            console.log("ISSUE WITH WAKE ON LAN SETTINGS");
          } else {
            const wakeButton = document.getElementById("printerWakeHost-" + printer._id);
            if (wakeButton.classList.contains("d-none")) {
              wakeButton.classList.remove("d-none");
              wakeButton.addEventListener("click", (e) => {
                OctoFarmclient.post("printers/wakeHost", printer.powerSettings.wol);
              });
            }
          }
        }
      }
    }
  }

  static printerPowerBtn(id) {
    return `
      
             <button title="Toggle your printers power"
                                    id="printerPower-${id}"
                                    class="btn btn-outline-danger btn-sm" type="button" disabled>
                                <i id="printerStatus-${id}" class="fas fa-power-off" style="color: black;"></i>
                            </button>
                            <button title="Other power actions" type="button" class="btn btn-sm btn-outline-danger dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span class="sr-only">Toggle Dropdown</span>
                            </button>
                            <div class="dropdown-menu text-center dropdown-menu-right">
                                  <a id="printerPowerOn-${id}" title="Turn on your printer" class="dropdown-item d-none" href="#"><i class="textComplete fas fa-power-off"></i> Power On Printer</a>
                                <a id="printerPowerOff-${id}" title="Turn off your printer" class="dropdown-item d-none" href="#"><i class="textOffline fas fa-power-off"></i> Power Off Printer</a>
                          
                                <div id="printerDropDownMaker-${id}" class="dropdown-divider d-none"></div>
                                <a id="printerRestartOctoPrint-${id}" title="Restart OctoPrint Service" class="dropdown-item d-none" href="#"><i class="textActive fas fa-redo"></i> Restart OctoPrint</a>
                                <a id="printerRestartHost-${id}" title="Reboot OctoPrint Host" class="dropdown-item d-none" href="#"><i class="textActive fas fa-sync-alt"></i> Reboot Host</a>
                                <a id="printerWakeHost-${id}" title="Wake up OctoPrint Host" class="dropdown-item d-none" href="#"><i class="textComplete fas fa-power-off"></i> Wake Host</a>
                                <a id="printerShutdownHost-${id}" title="Shutdown OctoPrint Host" class="dropdown-item d-none" href="#"><i class="textOffline fas fa-power-off"></i> Shutdown Host</a>
                            </div>
        </div>
    `;
  }
}
