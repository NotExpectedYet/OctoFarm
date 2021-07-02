import OctoFarmClient from "../octofarm_client.js";
import UI from "../functions/ui";

export async function isFilamentManagerPluginSyncEnabled() {
  try {
    const systemSettings = await OctoFarmClient.get("system/settings");
    return systemSettings.filamentManager;
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      "There was an issue contacting the server, please check your logs",
      3000
    );
  }
}

export function setupFilamentManagerDisableBtn() {
  const disableFilManagerBtn = document.getElementById(
    "disable-FilamentManager"
  );
  disableFilManagerBtn.addEventListener("click", async (event) => {
    try {
      let filamentManagerDisabled = await OctoFarmClient.post(
        "filament/disableFilamentPlugin",
        {
          activate: true
        }
      );
      if (filamentManagerDisabled) {
        UI.createAlert(
          "success",
          "Successfully disabled filament manager and removed all spools / profiles.",
          3000
        );
      } else {
        UI.createAlert(
          "error",
          "Unable to disable filament manager please check the filament manager logs.",
          3000
        );
      }
    } catch (e) {
      console.error(e);
      UI.createAlert(
        "error",
        "Something went wrong, please check the filament manager logs: " + e,
        3000
      );
    }
  });
}

export function setupFilamentManagerSyncBtn() {
  const filamentManagerSyncBtn = document.getElementById(
    "resyncFilamentManagerBtn"
  );
  filamentManagerSyncBtn.addEventListener("click", async (event) => {
    UI.addLoaderToElementsInnerHTML(filamentManagerSyncBtn);
    filamentManagerSyncBtn.disabled = true;
    try {
      const filamentManagerSyncEnabled = await OctoFarmClient.post(
        "filament/filamentManagerSync",
        {
          activate: true
        }
      );
      if (filamentManagerSyncEnabled) {
        UI.createAlert(
          "success",
          "Successfully disabled filament manager and removed all spools / profiles.",
          3000
        );
      } else {
        UI.createAlert(
          "error",
          "Unable to disable filament manager please check the filament manager logs.",
          3000
        );
      }
    } catch (e) {
      console.error(e);
      UI.createAlert(
        "error",
        "Something went wrong, please check the filament manager logs: " + e,
        3000
      );
    } finally {
      UI.removeLoaderFromElementInnerHTML(filamentManagerSyncBtn);
      filamentManagerSyncBtn.disabled = false;
    }
  });
}

export function setupFilamentManagerReSyncBtn() {
  const filamentManagerEnabled = isFilamentManagerPluginSyncEnabled();
  if (filamentManagerEnabled) {
    const resyncBtn = document.getElementById("resyncFilamentManagerBtn");
    resyncBtn.addEventListener("click", async (e) => {
      UI.addLoaderToElementsInnerHTML(resyncBtn);
      try {
        const post = await OctoFarmClient.post(
          "filament/filamentManagerReSync"
        );
        UI.createAlert(
          "success",
          `Successfully synced filament manager! <br> Profiles - Updated: ${post.updatedProfiles} / New: ${post.newProfiles} <br> Spools - Updated: ${post.updatedSpools} / New: ${post.newSpools}`,
          4000,
          "Clicked"
        );
      } catch (e) {
        UI.createAlert(
          "error",
          "Failed to sync filament manager, please check the logs...",
          4000,
          "Clicked"
        );
      }
      UI.removeLoaderFromElementInnerHTML(resyncBtn);
    });
  }
}

// export async function returnSelected(id, profiles) {
//   console.log("Return Selected");
//   let profileId = null;
//   const filamentManager = await checkFilamentManager();
//   if (filamentManager) {
//     profileId = _.findIndex(profiles, function (o) {
//       return o.profile.index == id.spools.profile;
//     });
//   } else {
//     profileId = _.findIndex(profiles, function (o) {
//       return o._id == id.spools.profile;
//     });
//   }
//   return `${id.spools.name} (${(id.spools.weight - id.spools.used).toFixed(
//     0
//   )}g) - ${profiles[profileId].profile.material}`;
// }

export async function returnDropDown(history) {
  try {
    let dropDownLists = await OctoFarmClient.get("filament/get/dropDownList");
    if (history) {
      return dropDownLists.selected.historyDropDown;
    } else {
      return dropDownLists.selected.normalDropDown;
    }
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      "Issue contacting server, please check the logs..."
    );
  }
}

export async function selectFilament(printerId, spoolId, tool) {
  const data = {
    tool,
    printerId,
    spoolId
  };
  try {
    await OctoFarmClient.post("filament/select", data);
  } catch (e) {
    UI.createAlert(
      "error",
      "Issue changing your spool, please check the logs..."
    );
  }
}
