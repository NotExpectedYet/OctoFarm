import OctoFarmClient from "../octofarm.js";
import UI from "../functions/ui.js";

const editMessage = `
<div class="alert alert-info" role="alert">
Update any of the printer values below and press action when you've made your changes.
</div>
<div class="alert alert-warning" role="alert">
 OctoFarm will then update only the changed printers.
</div>
`;
const deleteMessage = `
<div class="alert alert-info" role="alert">
Select which printers you'd like to delete. Press action when you have selected all the printers you'd like to remove.
</div>
<div class="alert alert-danger" role="alert">
 This is unrecoverable! If you remove the database entry for your printer, any links in the database will be lost... i.e. History/Statistics. Unless you have a backup in place.
</div>
`;
const connectMessage = `
<div class="alert alert-info" role="alert">
Please select which printers you'd like to connect to from OctoPrint. Selected printers will attempt a connection with the preferred port settings from OctoPrint.
</div>
<div class="alert alert-warning" role="alert">
This can be updated in your printer settings on OctoFarm/OctoPrint. You will need to re-scan for OctoFarm to detect the changes if updated on OctoPrint.
</div>
<div class="alert alert-danger" role="alert">
 If this doesn't exist the connection attempt will fall back to AUTO and could fail/put your printer in an error state. 
</div>
`;
const disconnectMessage = `
<div class="alert alert-info" role="alert">
Please select which printers you'd like to disconnect from OctoPrint.
</div>
<div class="alert alert-warning" role="alert">
This will by default skip Active printers. This is not an emergency stop button!
</div>

`;
const pluginInstallMessage = `
<div class="alert alert-info" role="alert">
Please select which printers you'd like to action a plugin installation on... You will be able to choose multiple plugins on the next pop up.
</div>
<div class="alert alert-warning" role="alert">
  Your plugin installation will be skipped if it's already installed...
</div>
`;
const powerOnOffMessage = `
<div class="alert alert-info" role="alert">
Please select your list of printers to action the power command on. You will be able to choose the actual command on the next pop up.
</div>
<div class="alert alert-danger" role="alert">
  These commands will run without user interaction... It will skip by default any active printers.
</div>
`;
const preHeatMessage = `
<div class="alert alert-info" role="alert">
  Please select your list of printers to action the pre-heat command. You will configure the temperatures on the next pop up.
</div>
<div class="alert alert-danger" role="alert">
  Due to this allowing for temps to be actioned on the fly it will not check printer state before doing so.
</div>
`;

const controlPrintersMessage = `
<div class="alert alert-info" role="alert">
  Please select your list of printers you'd like to bulk control.
</div>
<div class="alert alert-danger" role="alert">
  Due to this allowing for temps to be actioned on the fly it will not check printer state before doing so.
</div>
`;

const gcodePrintersMessage = `
<div class="alert alert-info" role="alert">
  Please select your list of printers you'd like to send gcode commands to.
</div>
<div class="alert alert-info" role="alert">
  Commands split up by a new line will be sent sequentially to the terminal.
</div>
<div class="alert alert-danger" role="alert">
  Due to this allowing for gcode commands to be sent on the fly it will not check printer state before doing so.
</div>
`;

const printersTable = `
<div class="row">
    <div class="col-lg-12">
      <div class="pb-2" id="selectMessageBox"></div>
    </div>
    <div class="col-md-3">
      <div class="input-group mb-3">
        <div class="input-group-prepend">
            <label class="input-group-text" for="printerStateList">State: </label>
        </div>
        <select class="custom-select" id="printerStateList" data-jplist-control="select-filter" data-group="printer-list" data-name="state">
          <option selected href="#" data-value="all"data-path="default">
            Filter
          </option>
          <option href="#" value="active" data-path=".Active">
            Active
          </option>
          <option href="#" value="idle" data-path=".Idle">
            Idle
          </option>
          <option href="#" value="complete" data-path=".Complete">
            Complete
          </option>
          <option href="#" value="disconnected"data-path=".Disconnected">
            Disconnected
          </option>
        </select>
      </div>
    </div>
    <div class="col-md-3">
     <div class="input-group mb-3">
        <div class="input-group-prepend">
            <label class="input-group-text" for="printerGroupList">Group: </label>
        </div>
        <select class="custom-select" id="printerGroupList"
                data-jplist-control="select-filter"
                data-group="printer-list"
                data-name="group">
<!--                            Filled dynamically -->
        </select>
      </div>
    </div>
    <div id="selectBtns" class="col-md-3 text-center">
    </div>
    <div id="actionBtn" class="col-md-3  text-center">
    </div>
</div>
<table class="table table-dark">
  <thead>
    <tr>
      <th id="selectColumn" scope="col">Select</th>
      <th scope="col">Index</th>
      <th scope="col">Name</th>
      <th scope="col" id="urlColumn" class="d-none">Printer URL</th>
      <th id="stateColumn" scope="col">State</th>
      <th scope="col">Group</th>
      <th id="spoolColumn" scope="col">Spool</th>
      <th id="cameraColumn" scope="col" class="d-none">Camera URL</th>
      <th id="apiColumn" scope="col" class="d-none">API KEY</th>
    </tr>
  </thead>
  <tbody id="printerSelectBody" data-jplist-group="printer-list">
<!-- Filled dynamically -->
  </tbody>
</table>
`;

export default class PrinterSelect {
  static getSelectableList(printer) {
    return `
<tr id="${printer.id}" class="${printer.state}" data-jplist-item>
    <td>
        <div class="custom-control custom-checkbox">
            <input type="checkbox" class="custom-control-input Idle" id="checkBox-${
              printer.id
            }" value="${printer.id}">
            <label class="custom-control-label" for="checkBox-${printer.id}">
            </label>
        </div>
    </td>
    <th scope="row">${printer.index}</th>
    <td>${printer.name}</td>
    <td class="${printer.state}">${printer.state}</td>
    <td class="${printer.group.replace(/\s/g, "_")}">${printer.group}</td>
    <td>${printer.spool}</td>
</tr>
`;
  }

  static getEditableList(printer) {
    return `
<tr id="editPrinterCard-${printer.id}" class="${printer.state}" data-jplist-item>
  <th scope="row">${printer.index}</th>
  <td><input id="editInputName-${printer.id}" type="text" class="form-control Idle" placeholder="${printer.name}" aria-label="Username" aria-describedby="basic-addon1"></td>
                          <td><input id="editInputURL-${printer.id}" type="text" class="form-control Idle" placeholder="${printer.printerURL}" aria-label="Username" aria-describedby="basic-addon1"></td>
                          <td class="${printer.state} d-none">${printer.state}</td>
                          <td><input id="editInputGroup-${printer.id}" type="text" class="form-control Idle" placeholder="${printer.group}" aria-label="Username" aria-describedby="basic-addon1"></td>
                          <td><input id="editInputCamera-${printer.id}" type="text" class="form-control Idle" placeholder="${printer.cameraURL}" aria-label="Username" aria-describedby="basic-addon1"></td>
                          <td><input id="editInputApikey-${printer.id}" type="text" class="form-control Idle" placeholder="${printer.apikey}" aria-label="Username" aria-describedby="basic-addon1"></td>
    </tr>`;
  }

  static isOffline(state, editable, override) {
    if (editable) {
      return true;
    } else if (override) {
      return true;
    } else {
      return state !== "Offline";
    }
  }

  static async create(element, editable, action, callback) {
    let saveEditsBtn = document.getElementById("saveEditsBtn");
    if (saveEditsBtn) {
      saveEditsBtn.remove();
    }
    if (action) {
      document.getElementById("printerSelectTitle").innerHTML = action;
    }
    //Setup elements
    element.innerHTML = "";
    element.innerHTML = printersTable;
    let messageBox = document.getElementById("selectMessageBox");
    messageBox.innerHTML = "";
    let override = false;
    if (action === "Printer Deletion") {
      override = true;
      messageBox.innerHTML = deleteMessage;
    } else if (action === "Edit Printers") {
      messageBox.innerHTML = editMessage;
    } else if (action === "Disconnect Printers") {
      messageBox.innerHTML = disconnectMessage;
    } else if (action === "Connect Printers") {
      messageBox.innerHTML = connectMessage;
    } else if (action === "Install Plugins") {
      messageBox.innerHTML = pluginInstallMessage;
    } else if (action === "Power On/Off Printers") {
      messageBox.innerHTML = powerOnOffMessage;
    } else if (action === "Pre-Heat Printers") {
      messageBox.innerHTML = preHeatMessage;
    } else if (action === "Control Printers") {
      messageBox.innerHTML = controlPrintersMessage;
    } else if (action === "Send Gcode to Printers") {
      messageBox.innerHTML = gcodePrintersMessage;
    }
    const printersInfo = await OctoFarmClient.post("printers/printerInfo");
    // const groups = await OctoFarmClient.get("groups/list");

    const printers = await printersInfo.json();
    const groupList = [];
    const printerList = [];

    printers.forEach((printer) => {
      if (
        typeof printer.printerState !== "undefined" &&
        this.isOffline(printer.printerState.colour.category, editable, override)
      ) {
        let spoolName = "";
        if (printer.selectedFilament.length !== 0) {
          printer.selectedFilament.forEach((spool, index) => {
            if (spool !== null) {
              spoolName += `Tool ${index}: ${spool.spools.name} - ${spool.spools.material} <br>`;
            } else {
              spoolName += `Tool ${index}: No Spool Selected <br>`;
            }
          });
        } else {
          spoolName = "No Spool Selected";
        }
        const forList = {
          id: printer._id,
          index: printer.sortIndex,
          name: printer.printerName,
          printerURL: printer.printerURL,
          state: printer.printerState.colour.category,
          group: printer.group,
          spool: spoolName,
          cameraURL: printer.cameraURL,
          apikey: printer.apikey
        };
        printerList.push(forList);
      }
      if (printer.group !== "") {
        const group = {
          display: printer.group,
          tag: printer.group.replace(/\s/g, "_")
        };
        groupList.push(group);
      }
    });

    const groupListUnique = _.uniq(groupList, "tag");
    if (printerList.length !== 0) {
      //Create printers table

      const tableBody = document.getElementById("printerSelectBody");
      if (editable) {
        document.getElementById("spoolColumn").classList.add("d-none");
        document.getElementById("stateColumn").classList.add("d-none");
        document.getElementById("cameraColumn").classList.remove("d-none");
        document.getElementById("apiColumn").classList.remove("d-none");
        document.getElementById("selectColumn").classList.add("d-none");
        document.getElementById("urlColumn").classList.remove("d-none");

        printerList.forEach((printer) => {
          tableBody.insertAdjacentHTML("beforeend", this.getEditableList(printer));
        });
      } else {
        printerList.forEach((printer) => {
          tableBody.insertAdjacentHTML("beforeend", this.getSelectableList(printer));
        });
      }

      const printerGroupList = document.getElementById("printerGroupList");
      printerGroupList.innerHTML = "";
      printerGroupList.insertAdjacentHTML(
        "beforeend",
        '<option selected value="all" data-path="default">Filter</option>'
      );
      groupListUnique.forEach((group, index) => {
        printerGroupList.insertAdjacentHTML(
          "beforeend",
          `<option value="${group.tag.toLowerCase()}" data-path=".${group.tag}">${
            group.display
          }</option>`
        );
      });

      // Printer group dropdown
      printers.forEach((printer) => {
        const printerGroupAssignSelect = document.getElementById(`editInputGroup-${printer._id}`);
        if (!printerGroupAssignSelect) return;

        groupListUnique.forEach((group, index) => {
          printerGroupAssignSelect.insertAdjacentHTML(
            "beforeend",
            `<option value="${group.tag.toLowerCase()}" data-path=".${group.tag}">${
              group.display
            }</option>`
          );
        });
      });
    } else {
      const tableBody = document.getElementById("printerSelectBody");
      tableBody.insertAdjacentHTML("beforeend", "<tr><td>No Online Printers</td></tr>");
    }
    PrinterSelect.addListeners(editable, callback);
  }

  static addListeners(editable, callback) {
    if (!editable) {
      document.getElementById("selectBtns").innerHTML = `
                    <button id="selectAll" type="button" class="btn btn-secondary"><i class="fas fa-check-square"></i> Select All</button>
                    <button id="selectNone" type="button" class="btn btn-secondary"><i class="fas fa-square"></i> Deselect All</button>
            `;
      document.getElementById("selectAll").addEventListener("click", (e) => {
        const checkBoxes = document.querySelectorAll('input[type="checkbox"]:not(:checked)');
        checkBoxes.forEach((box) => {
          box.checked = true;
        });
      });
      document.getElementById("selectNone").addEventListener("click", (e) => {
        const checkBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
        checkBoxes.forEach((box) => {
          box.checked = false;
        });
      });
    } else {
      UI.addSelectListeners("editInput");
    }
    if (callback) {
      document.getElementById("actionBtn").insertAdjacentHTML(
        "beforeend",
        `
                      <button id="saveEditsBtn" class="btn btn-success" data-dismiss="modal" aria-label="Close">Action</button>
      `
      );
      document.getElementById("saveEditsBtn").addEventListener("click", callback);
    }
    jplist.init();
  }

  static getSelected() {
    const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const printers = [];
    checkedBoxes.forEach((box) => {
      if (box.id.includes("checkBox")) {
        printers.push(box);
      }
    });
    return printers;
  }

  static selectFilter() {}
}
