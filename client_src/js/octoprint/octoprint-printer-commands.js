import OctoPrintClient from "../lib/octoprint";
import UI from "../lib/functions/ui";

export async function printerPreHeatChamber(printer, chamberTemp) {
  let chamberData = {
    command: "target",
    target: 0
  };
  if (chamberTemp.value !== "" && !isNaN(chamberTemp.value)) {
    chamberData.target = parseInt(chamberTemp.value);
  }
  //Set chamber temp
  if (chamberTemp.value !== "" && !isNaN(chamberTemp.value)) {
    let post = await OctoPrintClient.post(printer, "printer/chamber", chamberData);
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        UI.createAlert(
          "success",
          `Successfully set chamber target attempt to ${printer.printerName}...`,
          3000,
          "Clicked"
        );
      } else {
        UI.createAlert(
          "error",
          `There was an issue setting chamber target attempt to ${printer.printerName} are you sure it's online?`,
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
export async function printerPreHeatBed(printer, bedTemp) {
  let bedData = {
    command: "target",
    target: 0
  };
  if (bedTemp.value !== "" && !isNaN(bedTemp.value)) {
    bedData.target = parseInt(bedTemp.value);
  }
  //Set bed temp
  if (bedTemp.value !== "" && !isNaN(bedTemp.value)) {
    let post = await OctoPrintClient.post(printer, "printer/bed", bedData);
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        UI.createAlert(
          "success",
          `Successfully set bed target attempt to ${printer.printerName}...`,
          3000,
          "Clicked"
        );
      } else {
        UI.createAlert(
          "error",
          `There was an issue setting bed target attempt to ${printer.printerName} are you sure it's online?`,
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
export async function printerPreHeatTool(printer, toolTemp, toolNumber) {
  let toolData = {
    command: "target",
    targets: {}
  };
  if (toolTemp.value !== "" && !isNaN(toolTemp.value)) {
    toolData.targets["tool" + toolNumber.value] = parseInt(toolTemp.value);
  }
  if (toolTemp.value !== "" && !isNaN(toolTemp.value)) {
    let post = await OctoPrintClient.post(printer, "printer/tool", toolData);
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        UI.createAlert(
          "success",
          `Successfully set tool${toolNumber.value} target attempt to ${printer.printerName}...`,
          3000,
          "Clicked"
        );
      } else {
        UI.createAlert(
          "error",
          `There was an issue setting tool${toolNumber.value} target attempt to ${printer.printerName} are you sure it's online?`,
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

export async function printerStartPrint(printer, e) {
  e.target.disabled = true;
  const opts = {
    command: "start"
  };
  await OctoPrintClient.jobAction(printer, opts, e);
}

export async function printerPausePrint(printer, e) {
  e.target.disabled = true;
  const opts = {
    command: "pause",
    action: "pause"
  };
  await OctoPrintClient.jobAction(printer, opts, e);
}

export async function printerRestartPrint(printer, e) {
  e.target.disabled = true;
  const opts = {
    command: "restart"
  };
  await OctoPrintClient.jobAction(printer, opts, e);
}

export async function printerResumePrint(printer, e) {
  e.target.disabled = true;
  const opts = {
    command: "pause",
    action: "resume"
  };
  await OctoPrintClient.jobAction(printer, opts, e);
}

export async function printerStopPrint(printer, e) {
  e.target.disabled = true;
  const opts = {
    command: "cancel"
  };
  await OctoPrintClient.jobAction(printer, opts, e);
}

export async function printerMoveAxis(e, printer, axis, dir) {
  await OctoPrintClient.move(e, printer, "jog", axis, dir);
}

export async function printerHomeAxis(e, printer, axis) {
  await OctoPrintClient.move(e, printer, "home", axis);
}

export async function printerSendGcode(printer) {
  let lines = result.match(/[^\r\n]+/g);
  lines = lines.map(function (name) {
    if (!name.includes("=")) {
      return name.toLocaleUpperCase();
    } else {
      return name;
    }
  });
  const opt = {
    commands: lines
  };
  const post = await OctoPrintClient.post(printer, "printer/command", opt);
  if (post.status === 204) {
    UI.createAlert("success", "Your gcode commands have successfully been sent!", 3000, "Clicked");
  } else {
    UI.createAlert(
      "danger",
      "Your gcode failed to send! Please check the printer is able to receive these commands.",
      3000,
      "Clicked"
    );
  }
}
