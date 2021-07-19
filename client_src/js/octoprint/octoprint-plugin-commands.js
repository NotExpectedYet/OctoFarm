import OctoPrintClient from "../lib/octoprint.js";
import OctoFarmClient from "../lib/octofarm_client.js";
import UI from "../lib/functions/ui";
import PrinterSelect from "../lib/modules/printerSelect";

const printerBase = "printers";
const printerInfoURL = "/printerInfo";

async function updateBtnOnClick(printerID) {
  try {
    let data = {
      i: printerID
    };

    const printer = await OctoFarmClient.post(printerBase + printerInfoURL, data);

    let pluginsToUpdate = [];
    let autoSelect = [];
    if (printer.octoPrintPluginUpdates.length > 0) {
      printer.octoPrintPluginUpdates.forEach((plugin) => {
        pluginsToUpdate.push({
          text: `${plugin.displayName} - Version: ${plugin.displayVersion}`,
          value: plugin.id
        });
        autoSelect.push(plugin.id);
      });
      bootbox.prompt({
        title: "Select the plugins you'd like to update below...",
        inputType: "select",
        multiple: true,
        value: autoSelect,
        inputOptions: pluginsToUpdate,
        callback: async function (result, printer) {
          if (result.length > 0) {
            await updateOctoPrintPlugins(result, printer);
          }
        }
      });
    } else {
      UI.createAlert(
        "info",
        "Please rescan your device as there's no plugins actually available..."
      );
    }
  } catch (e) {
    console.error(e);
    UI.createAlert("error", `Unable to grab latest printer information: ${e}`, 0, "clicked");
  }
}

export function setupUpdateOctoPrintPluginsBtn(printer) {
  const octoPrintClientPluginUpdateBtn = document.getElementById(
    `octoprintPluginUpdate-${printer._id}`
  );
  if (octoPrintClientPluginUpdateBtn) {
    octoPrintClientPluginUpdateBtn.addEventListener("click", async () => {
      await updateBtnOnClick(printer._id);
    });
  }
}

export async function updateOctoPrintPlugins(pluginList, printer) {
  const data = {
    targets: pluginList,
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
      `${printer.printerName}: Successfully updated! your instance will restart now.`,
      3000,
      "Clicked"
    );
    let post = await OctoPrintClient.systemNoConfirm(printer, "restart");
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        UI.createAlert(
          "success",
          `Successfully made restart attempt to ${printer.printerName}... You may need to Re-Sync!`,
          3000,
          "Clicked"
        );
      } else {
        UI.createAlert(
          "error",
          `There was an issue sending restart to ${printer.printerName} are you sure it's online?`,
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
      "error",
      `${printer.printerName}: Failed to update, manual intervention required!`,
      3000,
      "Clicked"
    );
  }
}

export async function octoPrintPluginInstallAction(printer, pluginList, action) {
  let cleanAction = action.charAt(0).toUpperCase() + action.slice(1);
  if (action === "install") {
    cleanAction = cleanAction + "ing";
  }
  if (printer.printerState.colour.category !== "Active") {
    for (let r = 0; r < pluginList.length; r++) {
      let alert = UI.createAlert(
        "warning",
        `${printer.printerName}: ${cleanAction} - ${pluginList[r]}<br>Do not navigate away from this screen!`
      );
      let postData = {};
      if (action === "install") {
        postData = {
          command: action,
          dependency_links: false,
          url: pluginList[r]
        };
      } else {
        postData = {
          command: action,
          plugin: pluginList[r]
        };
      }

      const post = await OctoPrintClient.post(printer, "plugin/pluginmanager", postData);
      alert.close();
      if (post.status === 409) {
        UI.createAlert(
          "error",
          "Plugin not installed... Printer could be active...",
          4000,
          "Clicked"
        );
      } else if (post.status === 400) {
        UI.createAlert("error", "Malformed request... please log an issue...", 4000, "Clicked");
      } else if (post.status === 200) {
        let response = await post.json();
        if (response.needs_restart || response.needs_refresh) {
          UI.createAlert(
            "success",
            `${printer.printerName}: ${pluginList[r]} - Has successfully been installed... OctoPrint restart is required!`,
            4000,
            "Clicked"
          );
        } else {
          UI.createAlert(
            "success",
            `${printer.printerName}: ${pluginList[r]} - Has successfully been installed... No further action requested...`,
            4000,
            "Clicked"
          );
        }
      }
    }
  } else {
    UI.createAlert(
      "danger",
      `${printer.printerName}: Is active skipping the plugin installation command...`
    );
  }
}
