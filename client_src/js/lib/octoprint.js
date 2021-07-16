import UI from "./functions/ui.js";
import OctoFarmClient from "./octofarm.js";

export default class OctoPrintClient {
  static get(printer, item) {
    const url = `${printer.printerURL}/${item}`;
    return fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      }
    }).catch((e) => {
      console.log(e);
    });
  }

  static postNOAPI(printer, item, data) {
    const url = `${printer.printerURL}/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify(data)
    }).catch((e) => {
      console.log(e);
    });
  }

  static post(printer, item, data) {
    const url = `${printer.printerURL}/api/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify(data)
    }).catch((e) => {
      console.log(e);
    });
  }

  static folder(printer, item, data) {
    const url = `${printer.printerURL}/api/files/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "X-Api-Key": printer.apikey
      },
      body: data
    }).catch((e) => {
      console.log(e);
    });
  }

  static delete(printer, item) {
    const url = `${printer.printerURL}/api/${item}`;
    return fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      }
    }).catch((e) => {
      console.log(e);
    });
  }

  static async selectTool(printer, tool) {
    const opt = {
      command: "select",
      tool
    };
    const post = await OctoPrintClient.post(printer, "printer/tool", opt);

    if (post.status === 204) {
      return true;
    } else {
      return false;
    }
  }

  static async system(printer, action) {
    const url = "system/commands/core/" + action;
    bootbox.confirm({
      message: `Are your sure you want to ${action} ${printer.printerName}?`,
      buttons: {
        cancel: {
          label: '<i class="fa fa-times"></i> No'
        },
        confirm: {
          label: '<i class="fa fa-check"></i> Yes'
        }
      },
      async callback(result) {
        if (result) {
          const post = await OctoPrintClient.post(printer, url).catch((e) => {
            UI.createAlert("danger", e, 4000, "Clicked");
          });

          if (post.status === 204) {
            UI.createAlert(
              "success",
              `${printer.printerName}: ${action} was successful`,
              3000,
              "clicked"
            );
          } else {
            UI.createAlert(
              "error",
              `${printer.printerName}: ${action} was unsuccessful. Please make sure printer is connected and commands are setup in Settings -> Server.`,
              3000,
              "clicked"
            );
          }
        }
      }
    });
  }

  static async systemNoConfirm(printer, action) {
    const url = "system/commands/core/" + action;
    return await OctoPrintClient.post(printer, url);
  }

  static async move(element, printer, action, axis, dir) {
    const flashReturn = function () {
      element.target.classList = "btn btn-light";
    };
    const url = "printer/printhead";
    let post = null;
    let amount = await document.querySelectorAll("#pcAxisSteps > .btn.active");
    amount = amount[0].innerHTML;
    let opt = null;
    if (action === "home") {
      opt = {
        command: action,
        axes: axis
      };
    } else if (action === "jog") {
      if (dir != undefined) {
        amount = Number(dir + amount);
      } else {
        amount = Number(amount);
      }
      opt = {
        command: action,
        [axis]: amount
      };
    } else if (action === "feedrate") {
      opt = {
        command: action,
        factor: amount
      };
    }
    post = await OctoPrintClient.post(printer, url, opt);
    if (post.status === 204) {
      element.target.classList = "btn btn-success";
      setTimeout(flashReturn, 500);
    } else {
      element.target.classList = "btn btn-danger";
      setTimeout(flashReturn, 500);
    }
  }

  static async checkFile(printer, fullPath) {
    const url = "api/files/local/" + fullPath;

    let response = await OctoPrintClient.get(printer, url);
    return response.status;
  }

  static async file(printer, fullPath, action, notify = true) {
    const url = "files/local/" + fullPath;
    let post = null;
    if (action === "load") {
      const opt = {
        command: "select",
        print: false
      };
      post = await OctoPrintClient.post(printer, url, opt);
      return post.status;
    } else if (action === "print") {
      const opt = {
        command: "select",
        print: true
      };
      // Make sure feed/flow are set before starting print...
      const flow = {
        command: "flowrate",
        factor: parseInt(printer.flowRate)
      };
      await OctoPrintClient.post(printer, "printer/tool", flow);
      const feed = {
        command: "feedrate",
        factor: parseInt(printer.feedRate)
      };
      await OctoPrintClient.post(printer, "printer/printhead", feed);
      post = await OctoPrintClient.post(printer, url, opt);
    } else if (action === "delete") {
      post = await OctoPrintClient.delete(printer, url);
    }
    if (post?.status === 204) {
      if (action === "delete") {
        const opt = {
          i: printer,
          fullPath
        };
        const fileDel = await OctoFarmClient.post("printers/removefile", opt);
        if (notify) {
          UI.createAlert(
            "success",
            `${printer.printerName}: delete completed`,
            3000,
            "clicked"
          );
        }
        return fileDel;
      } else {
        if (notify) {
          UI.createAlert(
            "success",
            `${printer.printerName}: ${action} actioned`,
            3000,
            "clicked"
          );
        }
      }
    } else {
      // TODO improve handling
      if (notify) {
        UI.createAlert(
          "error",
          `${printer.printerName}: ${action} failed`,
          3000,
          "clicked"
        );
      }
    }
  }

  static async jobAction(printer, opts, element) {
    let checkSettings = await OctoFarmClient.get("settings/server/get");
    checkSettings = await checkSettings.json();
    // Make sure feed/flow are set before starting print...
    const flow = {
      command: "flowrate",
      factor: parseInt(printer.flowRate)
    };
    await OctoPrintClient.post(printer, "printer/tool", flow);
    const feed = {
      command: "feedrate",
      factor: parseInt(printer.feedRate)
    };

    await OctoPrintClient.post(printer, "printer/printhead", feed);
    const body = {
      i: printer._id
    };

    let filamentCheck = false;
    if (typeof checkSettings.filament !== "undefined") {
      filamentCheck = checkSettings.filament.filamentCheck;
    }
    let printerCheck = false;
    if (
      printer.selectedFilament != null &&
      Array.isArray(printer.selectedFilament)
    ) {
      printerCheck = printer.selectedFilament.every(function (e) {
        return e !== null;
      });
    }
    if (filamentCheck && !printerCheck && opts.command === "start") {
      bootbox.confirm({
        message:
          "You have spools in the inventory, but none selected. Would you like to select a spool?",
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
        async callback(result) {
          if (!result) {
            if (
              printer.selectedFilament != null &&
              Array.isArray(printer.selectedFilament)
            ) {
              const offset = {
                command: "offset",
                offsets: {}
              };
              printer.selectedFilament.forEach((spool, index) => {
                if (spool != null) {
                  offset.offsets["tool" + index] = parseInt(
                    spool.spools.tempOffset
                  );
                }
              });

              const post = await OctoPrintClient.post(
                printer,
                "printer/tool",
                offset
              );
              console.log(offset);
            }
            await OctoPrintClient.post(printer, "printer/printhead", feed);
            const post = await OctoPrintClient.post(printer, "job", opts);
            if (element) {
              element.target.disabled = false;
            }
          }
        }
      });
    } else {
      await OctoPrintClient.post(printer, "printer/printhead", feed);
      const post = await OctoPrintClient.post(printer, "job", opts);
      if (
        printer.selectedFilament != null &&
        Array.isArray(printer.selectedFilament)
      ) {
        const offset = {
          command: "offset",
          offsets: {}
        };
        printer.selectedFilament.forEach((spool, index) => {
          if (spool != null) {
            offset.offsets["tool" + index] = parseInt(spool.spools.tempOffset);
          }
        });

        const post = await OctoPrintClient.post(
          printer,
          "printer/tool",
          offset
        );
      }
      if (element) {
        element.target.disabled = false;
      }
    }
  }

  static async connect(command, printer) {
    let opts = null;
    if (command === "connect") {
      opts = {
        command: "connect",
        port: document.getElementById("pmSerialPort").value,
        baudrate: parseInt(document.getElementById("pmBaudrate").value),
        printerProfile: document.getElementById("pmProfile").value,
        save: true
      };
    } else {
      opts = {
        command: "disconnect"
      };
    }
    const post = await OctoPrintClient.post(printer, "connection", opts);
    if (typeof post !== "undefined" && post.status === 204) {
      UI.createAlert(
        "success",
        `${printer.printerName}: ${opts.command}ion attempt was successful`,
        3000,
        "click"
      );
      if (command === "connect") {
        document.getElementById("pmSerialPort").disabled = true;
        document.getElementById("pmBaudrate").disabled = true;
        document.getElementById("pmProfile").disabled = true;
      } else {
        document.getElementById("pmSerialPort").disabled = false;
        document.getElementById("pmBaudrate").disabled = false;
        document.getElementById("pmProfile").disabled = false;
      }
    } else {
      document.getElementById("pmSerialPort").disabled = false;
      document.getElementById("pmBaudrate").disabled = false;
      document.getElementById("pmProfile").disabled = false;
      UI.createAlert(
        "error",
        `${printer.printerName}: could not ${opts.command}.`,
        3000,
        "click"
      );
    }
  }

  static async power(printer, url, action, command) {
    if (url.includes("[PrinterURL]")) {
      url = url.replace("[PrinterURL]", printer.printerURL);
    }
    if (url.includes("[PrinterAPI]")) {
      url = url.replace("[PrinterAPI]", printer.apikey);
    }
    if (typeof command === "undefined" || command.length === 0) {
      try {
        const post = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": printer.apikey
          }
        });
        if (post.status !== 200 || post.status !== 204) {
          UI.createAlert(
            "error",
            `${printer.printerName}: Could not complete ${action}`,
            3000
          );
        } else {
          UI.createAlert(
            "success",
            `${printer.printerName}: Successfully completed ${action}`,
            3000
          );
        }
      } catch (e) {
        UI.createAlert(
          "error",
          `${printer.printerName}: Could not complete ${action} - Error: ${e}`,
          3000
        );
      }
    } else {
      try {
        const post = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": printer.apikey
          },
          body: command
        });
        if (post.status !== 200 || post.status !== 204) {
          UI.createAlert(
            "error",
            `${printer.printerName}: Could not complete ${action}`,
            3000
          );
        } else {
          UI.createAlert(
            "success",
            `${printer.printerName}: Successfully completed ${action}`,
            3000
          );
        }
      } catch (e) {
        UI.createAlert(
          "error",
          `${printer.printerName}: Could not complete ${action} - Error: ${e}`,
          3000
        );
      }
    }
    return "done";
  }

  static async getPowerStatus(printer, url, command) {
    if (url.includes("[PrinterURL]")) {
      url = url.replace("[PrinterURL]", printer.printerURL);
    }
    if (url.includes("[PrinterAPI]")) {
      url = url.replace("[PrinterAPI]", printer.apikey);
    }
    if (typeof command === "undefined" || command === "" || command === null) {
      let post = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apikey
        }
      });
      if (post.status !== 200 || post.status !== 204) {
        return "No Status";
      } else {
        post = await post.json();
        return post;
      }
    } else {
      try {
        const post = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": printer.apikey
          },
          body: command
        });
        let status = "No Status";
        if (post.status === 200 || post.status === 204) {
          status = await post.json();
        }

        const powerStatusPrinter = document.getElementById(
          "printerStatus-" + printer._id
        );
        if (powerStatusPrinter) {
          if (status === "No Status") {
            powerStatusPrinter.style.color = "black";
          } else if (status[Object.keys(status)[0]]) {
            powerStatusPrinter.style.color = "green";
          } else {
            powerStatusPrinter.style.color = "red";
          }
        }
      } catch (e) {
        console.log("Printer Power Check failed... classing offline:", e);
      }
    }
  }
}
