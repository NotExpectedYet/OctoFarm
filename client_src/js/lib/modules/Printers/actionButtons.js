import PowerButton from "../powerButton.js";
import UI from "../../functions/ui";
import OctoPrintClient from "../../octoprint";
import OctoFarmClient from "../../octofarm";

function printerControlBtn(id) {
  return `
    <button  
         title="Control Your Printer"
         id="printerButton-${id}"
         type="button"
         class="tag btn btn-primary btn-sm"
         data-toggle="modal"
         data-target="#printerManagerModal" disabled
         >
            <i class="fas fa-print"></i>
    </button>
    `;
}
export function printerWebBtn(id, webURL) {
  return `
            <a title="Open OctoPrint"
               id="printerWeb-${id}"
               type="button"
               class="tag btn btn-info btn-sm"
               target="_blank"
               href="${webURL}" role="button"><i class="fas fa-globe-europe"></i></a>
    `;
}
function printerReSyncBtn(id) {
  return `
            <button  
                     title="Re-Sync your printer"
                     id="printerSyncButton-${id}"
                     type="button"
                     class="tag btn btn-success btn-sm"
            >
                <i class="fas fa-sync"></i>
            </button>
    `;
}

function printerQuickConnect(id) {
  return `
    <button  
         title="Quickly connect/disconnect your printer"
         id="printerQuickConnect-${id}"
         type="button"
         class="tag btn btn-danger btn-sm"
         >
            <i class="fas fa-toggle-off"></i>
    </button>
    `;
}
function powerBtnHolder(id) {
  return `
      <div class="btn-group" id="powerBtn-${id}">
      
      </div>
  `;
}

function printerQuickConnected(id) {
  let connectBtn = document.getElementById("printerQuickConnect-" + id);
  connectBtn.innerHTML = '<i class="fas fa-toggle-on"></i>';
  connectBtn.classList.remove("btn-danger");
  connectBtn.classList.add("btn-success");
  connectBtn.title = "Press to connect your printer!";
}
function printerQuickDisconnected(id) {
  let connectBtn = document.getElementById("printerQuickConnect-" + id);
  connectBtn.innerHTML = '<i class="fas fa-toggle-off"></i>';
  connectBtn.classList.remove("btn-success");
  connectBtn.classList.add("btn-danger");
  connectBtn.title = "Press to connect your printer!";
}

function init(printer, element) {
  document.getElementById(element).innerHTML = `
    ${printerControlBtn(printer._id)}  
    ${printerQuickConnect(printer._id)} 
    ${printerReSyncBtn(printer._id)}  
    ${printerWebBtn(printer._id, printer.printerURL)}    
    ${powerBtnHolder(printer._id)}  
  `;
  PowerButton.applyBtn(printer, "powerBtn-");
  if (
    printer.currentConnection != null &&
    printer.currentConnection.port != null &&
    printer.printerState.colour.category != "Offline"
  ) {
    printerQuickConnected(printer._id);
  } else {
    printerQuickDisconnected(printer._id);
  }
  if (printer.printerState.colour.category === "Offline") {
    document.getElementById("printerQuickConnect-" + printer._id).disabled = true;
  } else {
    document.getElementById("printerQuickConnect-" + printer._id).disabled = false;
  }
  addEventListeners(printer);
  return true;
}

function addEventListeners(printer) {
  //Quick Connect
  document
    .getElementById(`printerQuickConnect-${printer._id}`)
    .addEventListener("click", async (e) => {
      e.disabled = true;
      if (
        document
          .getElementById("printerQuickConnect-" + printer._id)
          .classList.contains("btn-danger")
      ) {
        let data = {};
        if (typeof printer.connectionOptions !== "undefined") {
          data = {
            command: "connect",
            port: printer.connectionOptions.portPreference,
            baudrate: parseInt(printer.connectionOptions.baudratePreference),
            printerProfile: printer.connectionOptions.printerProfilePreference
          };
        } else {
          UI.createAlert(
            "warning",
            `${printer.printerName} has no preferences saved, defaulting to AUTO...`,
            8000,
            "Clicked"
          );
          data.command = "connect";
          data.port = "AUTO";
          data.baudrate = 0;
          data.printerProfile = "_default";
        }
        let post = await OctoPrintClient.post(printer, "connection", data);
        if (typeof post !== "undefined") {
          if (post.status === 204) {
            UI.createAlert(
              "success",
              `Successfully made connection attempt to ${printer.printerName}...`,
              3000,
              "Clicked"
            );
          } else {
            UI.createAlert(
              "error",
              `There was an issue connecting to ${printer.printerName} it's either not online, or the connection options supplied are not available...`,
              3000,
              "Clicked"
            );
          }
        } else {
          UI.createAlert(
            "error",
            `No response from ${printer.printerName}, is it online???`,
            3000,
            "Clicked"
          );
        }
      } else {
        bootbox.confirm({
          message: "Are you sure you want to disconnect your printer?",
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
              let data = {
                command: "disconnect"
              };
              let post = await OctoPrintClient.post(printer, "connection", data);
              if (typeof post !== "undefined") {
                if (post.status === 204) {
                  UI.createAlert(
                    "success",
                    `Successfully made disconnect attempt to ${printer.printerName}...`,
                    3000,
                    "Clicked"
                  );
                } else {
                  UI.createAlert(
                    "error",
                    `There was an issue disconnecting to ${printer.printerName} are you sure it's online?`,
                    3000,
                    "Clicked"
                  );
                }
              } else {
                UI.createAlert(
                  "error",
                  `No response from ${printer.printerName}, is it online???`,
                  3000,
                  "Clicked"
                );
              }
            }
          }
        });
      }
    });
  //Re-Sync printer
  document
    .getElementById(`printerSyncButton-${printer._id}`)
    .addEventListener("click", async (e) => {
      e.target.innerHTML = "<i class='fas fa-sync fa-spin'></i>";
      e.target.disabled = true;
      const data = {
        id: printer._id
      };
      let post = await OctoFarmClient.post("printers/reScanOcto", data);
      post = await post.json();
      if (post.msg.status !== "error") {
        UI.createAlert("success", post.msg.msg, 3000, "clicked");
      } else {
        UI.createAlert("error", post.msg.msg, 3000, "clicked");
      }

      e.target.innerHTML = "<i class='fas fa-sync'></i>";
      e.target.disabled = false;
    });
}

function checkQuickConnectState(printer) {
  document.getElementById("printerQuickConnect-" + printer._id).disabled =
    printer.printerState.colour.category === "Offline";
  if (typeof printer.connectionOptions !== "undefined") {
    if (
      printer.connectionOptions.portPreference === null ||
      printer.connectionOptions.baudratePreference === null ||
      printer.connectionOptions.printerProfilePreference === null
    ) {
      document.getElementById("printerQuickConnect-" + printer._id).disabled = true;
    }
  } else {
    document.getElementById("printerQuickConnect-" + printer._id).disabled = true;
  }

  if (
    (printer.printerState.colour.category !== "Offline" &&
      printer.printerState.colour.category === "Disconnected") ||
    printer.printerState.colour.category === "Error!"
  ) {
    printerQuickDisconnected(printer._id);
  } else if (
    printer.printerState.colour.category !== "Offline" &&
    printer.printerState.colour.category !== "Disconnected" &&
    !printer.printerState.colour.category !== "Error!"
  ) {
    printerQuickConnected(printer._id);
  } else {
    printerQuickDisconnected(printer._id);
  }
}

export { init, printerQuickConnected, printerQuickDisconnected, checkQuickConnectState };
