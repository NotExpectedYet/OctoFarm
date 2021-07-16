import Validate from "../lib/functions/validate";
import UI from "../lib/functions/ui";
import OctoFarmClient from "../lib/octofarm_client.js";

let newPrintersIndex = 0;

// TODO: clean up this file is a mess jim

class Printer {
  constructor(printerURL, camURL, apikey, group, name) {
    this.settingsAppearance = {
      color: "default",
      colorTransparent: false,
      defaultLanguage: "_default",
      name,
      showFahrenheitAlso: false
    };
    this.printerURL = printerURL;
    this.camURL = camURL;
    this.apikey = apikey;
    this.group = group;
  }
}
export class PrintersManagement {
  constructor(printerURL, camURL, apikey, group, name) {
    this.printer = new Printer(printerURL, camURL, apikey, group, name);
  }

  static addPrinter(newPrinter) {
    // Insert Blank Row at top of printer list
    if (
      document.getElementById("printerNewTable").classList.contains("d-none")
    ) {
      document.getElementById("printerNewTable").classList.remove("d-none");
    }

    if (typeof newPrinter !== "undefined") {
      document.getElementById("printerNewList").insertAdjacentHTML(
        "beforebegin",
        `
   <tr id="newPrinterCard-${newPrintersIndex}">
        <td><div class="mb-0">
          <input id="newPrinterName-${newPrintersIndex}" type="text" class="form-control" placeholder="Leave blank to grab from OctoPrint" value="${newPrinter.name}">
        </div></td>
        <td><div class="mb-0">
          <input id="newPrinterGroup-${newPrintersIndex}" type="text" class="form-control" placeholder="" value="${newPrinter.group}">
        </div></td>
        <td><div class="mb-0">
          <input id="newPrinterURL-${newPrintersIndex}" type="text" class="form-control" placeholder="" value="${newPrinter.printerURL}">
        </div></td>
        <td><div class="mb-0">
          <input id="newPrinterCamURL-${newPrintersIndex}" type="text" class="form-control" placeholder="Leave blank to grab from OctoPrint" value="${newPrinter.cameraURL}">
        </div></td>
        <td><div class="mb-0">
          <input id="newPrinterAPIKEY-${newPrintersIndex}" type="text" class="form-control" placeholder="" value="${newPrinter.apikey}">
        </div></td>
        <td><button id="saveButton-${newPrintersIndex}" type="button" class="btn btn-success btn-sm">
                <i class="fas fa-save"></i>
            </button></td>
        <td><button id="delButton-${newPrintersIndex}" type="button" class="btn btn-danger btn-sm">
                <i class="fas fa-trash"></i>
            </button></td>

    </tr>
  `
      );
    } else {
      document.getElementById("printerNewList").insertAdjacentHTML(
        "beforebegin",
        `
        <tr id="newPrinterCard-${newPrintersIndex}">
        <td><div class="mb-0">
          <input id="newPrinterName-${newPrintersIndex}" type="text" class="form-control" placeholder="Leave blank to grab from OctoPrint">
          <small>Example: <code>My Awesome Printer Name</code></small>
        </div></td>
        <td><div class="mb-0">
          <input id="newPrinterGroup-${newPrintersIndex}" type="text" class="form-control" placeholder="">
          <small>Example: <code>Rack 1</code></small>
        </div></td>
        <td><div class="mb-0">
          <input id="newPrinterURL-${newPrintersIndex}" type="text" class="form-control" placeholder="">
          <small>Example: <code>http://192.168.1.5:80</code></small>
        </div></td>
        <td><div class="mb-0">
          <input id="newPrinterCamURL-${newPrintersIndex}" type="text" class="form-control" placeholder="Leave blank to grab from OctoPrint">
          <small>Example: <code>http://192.168.1.5/webcam/?action=stream</code></small>
        </div></td>
        <td><div class="mb-0">
          <input id="newPrinterAPIKEY-${newPrintersIndex}" type="text" class="form-control" placeholder="">
          <small>OctoPrint Version 1.4.1+: <code>Must use generated User/Application Key</code></small>
        </div></td>
        <td><button id="saveButton-${newPrintersIndex}" type="button" class="btn btn-success btn-sm">
                <i class="fas fa-save"></i>
            </button></td>
        <td><button id="delButton-${newPrintersIndex}" type="button" class="btn btn-danger btn-sm">
                <i class="fas fa-trash"></i>
            </button></td>

    </tr>
  `
      );
    }
    let currentIndex = JSON.parse(JSON.stringify(newPrintersIndex));
    document
      .getElementById(`delButton-${newPrintersIndex}`)
      .addEventListener("click", (event) => {
        UI.removeLine(
          document.getElementById(`newPrinterCard-${currentIndex}`)
        );
        const table = document.getElementById("printerNewTable");
        if (table.rows.length === 1) {
          if (!table.classList.contains("d-none")) {
            table.classList.add("d-none");
          }
        }
      });
    document
      .getElementById(`saveButton-${newPrintersIndex}`)
      .addEventListener("click", (event) => {
        PrintersManagement.savePrinter(event.target);
      });
    newPrintersIndex++;
  }

  static async importPrinters() {
    return function (e) {
      const theBytes = e.target.result; // .split('base64,')[1];
      // Initial JSON validation
      if (Validate.JSON(theBytes)) {
        // If we can parse the file.

        // Grab uploaded file contents into an object
        const importPrinters = JSON.parse(theBytes);
        // Loop over import only importing printers with correct fields.
        for (let index = 0; index < importPrinters.length; index++) {
          const printer = {
            printerURL: "Key not found",
            cameraURL: "Key not found",
            name: "Key not found",
            group: "Key not found",
            apikey: "Key not found"
          };
          if (typeof importPrinters[index].name !== "undefined") {
            printer.name = importPrinters[index].name;
          }
          if (typeof importPrinters[index].printerURL !== "undefined") {
            printer.printerURL = importPrinters[index].printerURL;
          }
          if (typeof importPrinters[index].cameraURL !== "undefined") {
            printer.cameraURL = importPrinters[index].cameraURL;
          }
          if (typeof importPrinters[index].group !== "undefined") {
            printer.group = importPrinters[index].group;
          }
          if (typeof importPrinters[index].apikey !== "undefined") {
            printer.apikey = importPrinters[index].apikey;
          }
          PrintersManagement.addPrinter(printer);
        }
        UI.createAlert(
          "success",
          "Successfully imported your printer list, Please check it over and save when ready.",
          3000
        );
      } else {
        UI.createAlert(
          "error",
          "The file you have tried to upload contains json syntax errors.",
          3000
        );
      }
    };
  }

  static async deletePrinter(deletedPrinters) {
    if (deletedPrinters.length > 0) {
      try {
        const printersToRemove = await OctoFarmClient.post(
          "printers/remove",
          deletedPrinters
        );
        // Should help with SSE event re-building the deleted printer causing a refresh to be needed to actually clear from UI
        await UI.delay(5000);
        const printersRemoved = printersToRemove.printersRemoved;
        printersRemoved.forEach((printer) => {
          UI.createAlert(
            "success",
            `Printer: ${printer.printerURL} has successfully been removed from the farm...`,
            1000,
            "Clicked"
          );
          document.getElementById(`printerCard-${printer.printerId}`).remove();
        });
      } catch (e) {
        console.error(e);
        UI.createAlert(
          "error",
          "Something went wrong updating the server, please check your logs",
          3000,
          "clicked"
        );
      }
    } else {
      UI.createAlert(
        "error",
        "To delete a printer... one must first select a printer.",
        3000,
        "Clicked"
      );
    }
  }

  static async savePrinter(event) {
    try {
      // Gather the printer data...
      let newId = event.id.split("-");
      newId = newId[1];

      // Grab new printer cells...
      const printerURL = document.getElementById(`newPrinterURL-${newId}`);
      const printerCamURL = document.getElementById(
        `newPrinterCamURL-${newId}`
      );
      const printerAPIKEY = document.getElementById(
        `newPrinterAPIKEY-${newId}`
      );
      const printerGroup = document.getElementById(`newPrinterGroup-${newId}`);
      const printerName = document.getElementById(`newPrinterName-${newId}`);

      const errors = [];
      let printCheck = -1;
      if (printerURL.value !== "") {
        const printerInfo = await OctoFarmClient.post(
          "printers/printerInfo",
          {}
        );
        printCheck = _.findIndex(printerInfo, function (o) {
          return (
            JSON.stringify(o.printerURL) === JSON.stringify(printerURL.value)
          );
        });
      }
      // Check information is filled correctly...
      if (
        printerURL.value === "" ||
        printCheck > -1 ||
        printerAPIKEY.value === "" ||
        printerName.value === "" ||
        printerCamURL.value === ""
      ) {
        if (printerURL.value === "") {
          errors.push({
            type: "warning",
            msg: "Please input your printers URL"
          });
        }
        if (printerAPIKEY.value === "") {
          errors.push({
            type: "warning",
            msg: "Please input your printers API Key"
          });
        }
        if (printCheck > -1) {
          errors.push({
            type: "error",
            msg: `Printer URL: ${printerURL.value} already exists on farm`
          });
        }
      }
      if (errors.length > 0) {
        errors.forEach((error) => {
          UI.createAlert(error.type, error.msg, 3000, "clicked");
        });
      } else {
        const printers = [];
        const saveButton = document.getElementById(`saveButton-${newId}`);
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        saveButton.disabled = true;
        const printer = new PrintersManagement(
          printerURL.value,
          printerCamURL.value,
          printerAPIKEY.value,
          printerGroup.value,
          printerName.value
        ).build();
        printers.push(printer);
        const printersToAdd = await OctoFarmClient.post(
          "printers/add",
          printers
        );
        const printersAdded = printersToAdd.printersAdded;
        printersAdded.forEach((printer) => {
          UI.createAlert(
            "success",
            `Printer: ${printer.printerURL} has successfully been added to the farm...`,
            500,
            "Clicked"
          );
        });
        event.parentElement.parentElement.parentElement.remove();
        saveButton.innerHTML = '<i class="fas fa-save"></i>';
        saveButton.disabled = false;
      }
      const table = document.getElementById("printerNewTable");
      if (table.rows.length === 1) {
        if (!table.classList.contains("d-none")) {
          table.classList.add("d-none");
        }
      }
    } catch (e) {
      console.error(e);
      UI.createAlert(
        "error",
        "Something went wrong saving your printer, please check the logs",
        3000,
        "clicked"
      );
    }
  }

  build() {
    return this.printer;
  }
}
