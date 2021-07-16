import OctoPrintClient from "../lib/octoprint.js";
import UI from "../lib/functions/ui";
import OctoFarmClient from "../lib/octofarm_client";

const printerBase = "printers";
const printerInfoURL = "/printerInfo";

async function updateBtnOnClick(printerID) {
  try {
    let data = {
      i: printerID
    };

    const printer = await OctoFarmClient.post(
      printerBase + printerInfoURL,
      data
    );

    bootbox.confirm({
      message: "This will tell OctoPrint to update, are you sure?",
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
      callback: async function (result, printer) {
        if (result) {
          await updateOctoPrintClient(printer);
        }
      }
    });
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Unable to grab latest printer information: ${e}`,
      0,
      "clicked"
    );
  }
}

export function setupUpdateOctoPrintClientBtn(printer) {
  const octoPrintClientUpdateBtn = document.getElementById(
    `octoprintUpdate-${printer._id}`
  );
  if (octoPrintClientUpdateBtn) {
    octoPrintClientUpdateBtn.addEventListener("click", async () => {
      await updateBtnOnClick(printer._id);
    });
  }
}

export async function updateOctoPrintClient(printer) {
  const data = {
    targets: ["octoprint"],
    force: true
  };
  let updateRequest = await OctoPrintClient.postNOAPI(
    printer,
    "plugin/softwareupdate/update",
    data
  );
  if (updateRequest.status === 200) {
    UI.createAlert(
      "success",
      `${printer.printerName}: Update command fired, you may need to restart OctoPrint once complete.`,
      3000,
      "Clicked"
    );
  } else {
    UI.createAlert(
      "error",
      `${printer.printerName}: Failed to update, manual intervention required!`,
      3000,
      "Clicked"
    );
  }
}

export async function quickConnectPrinterToOctoPrint(printer) {
  let data = {};
  if (typeof printer.connectionOptions !== "undefined") {
    data = {
      command: "connect",
      port: printer.connectionOptions.portPreference,
      baudrate: printer.connectionOptions.baudratePreference,
      printerProfile: printer.connectionOptions.printerProfilePreference,
      save: true
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
    data.save = false;
  }
  if (printer.printerState.colour.category === "Disconnected") {
    const post = await OctoPrintClient.post(printer, "connection", data);
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
    UI.createAlert(
      "warning",
      `Printer ${printer.printerName} is not in "Disconnected" state... skipping`,
      3000,
      "Clicked"
    );
  }
}

export async function disconnectPrinterFromOctoPrint(printer) {
  let data = {
    command: "disconnect"
  };
  if (printer.printerState.colour.category === "Idle") {
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
  } else {
    UI.createAlert(
      "warning",
      `Printer ${printer.printerName} is not in "Idle" state... skipping`,
      3000,
      "Clicked"
    );
  }
}

export async function sendPowerCommandToOctoPrint(printer, powerCommand) {
  if (printer.printerState.colour.category !== "Active") {
    let post = await OctoPrintClient.systemNoConfirm(printer, powerCommand);
    await UI.delay(1000);
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        UI.createAlert(
          "success",
          `Successfully made ${result} attempt to ${printer.printerName}...`,
          3000,
          "Clicked"
        );
      } else {
        UI.createAlert(
          "error",
          `There was an issue sending ${result} to ${printer.printerName} are you sure it's online?`,
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
    UI.createAlert(
      "warning",
      `Printer ${printer.printerName} is not in "Idle" state... skipping`,
      3000,
      "Clicked"
    );
  }
}
