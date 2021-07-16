import UI from "./lib/functions/ui";
import Noty from "noty";

let interval = false;
let timer = false;
const notificationMarkReadSessionKey = "octofarm-updatemsg-read";
let pageReloadPersistedRead = false;

const drawModal = async function () {
  $("#lostServerConnection").modal("show");
};

const reloadWindow = async function () {
  if (location.href.includes("submitEnvironment")) {
    const hostName =
      window.location.protocol + "//" + window.location.host + "";
    window.location.replace(hostName);
    return false;
  } else {
    window.location.reload();
    return false;
  }
};

function checkUpdateAndNotify(updateResponse) {
  if (!!updateResponse?.update_available && !pageReloadPersistedRead) {
    // Show the notification once per page load
    pageReloadPersistedRead = true;
    // Disregard notification if it it's version is already stored
    let parsedStorageReleaseInfo;
    try {
      parsedStorageReleaseInfo = JSON.parse(
        localStorage.getItem(notificationMarkReadSessionKey)
      );
    } catch (e) {
      parsedStorageReleaseInfo = null;
    }
    // If the update button is available, we are on the system page. React to available updates accordingly.
    let updateOctoFarmBtn = document.getElementById("updateOctoFarmBtn");
    if (updateOctoFarmBtn) {
      updateOctoFarmBtn.disabled = false;
    }
    // Process the full notification or a shorter reminder
    if (
      !parsedStorageReleaseInfo ||
      parsedStorageReleaseInfo?.tag_name !==
        updateResponse?.latestReleaseKnown?.tag_name
    ) {
      if (window.location?.href.includes("/system")) {
        return;
      }

      var n = new noty({
        type: "success",
        theme: "bootstrap-v4",
        layout: "bottomRight",
        text: updateResponse?.message,
        buttons: [
          noty.button(
            "UPDATE",
            "btn btn-success",
            function () {
              window.location = "/system";
            },
            { id: "button1", "data-status": "ok" }
          ),
          noty.button("Mark read", "btn btn-error", function () {
            // Update the stored version to become the newest
            localStorage.setItem(
              notificationMarkReadSessionKey,
              JSON.stringify(updateResponse.latestReleaseKnown)
            );
            n.close();
          }),
          noty.button("Later", "btn btn-error", function () {
            n.close();
          })
        ]
      });
      n.show();
    } else {
      UI.createAlert(
        "success",
        `A small reminder: OctoFarm update available from ${updateResponse.current_version} to ${updateResponse?.latestReleaseKnown?.tag_name} ;)`,
        1000,
        "clicked"
      );
    }
  }
}

const serverAliveCheck = async function () {
  if (!interval) {
    interval = setInterval(async () => {
      const modal = document.getElementById("lostServerConnection");
      try {
        let alive = await fetch("/serverChecks/amialive");
        if (alive.status !== 200) throw "No Server Connection";
        alive = await alive.json();

        if (alive?.update && !alive.isDockerContainer) {
          try {
            checkUpdateAndNotify(alive.update);
          } catch (e) {
            console.warn(
              "Could not succesfully parse OctoFarm update notification"
            );
          }
        }

        if (modal.classList.contains("show")) {
          //Connection recovered, re-load printer page
          const spinner = document.getElementById("lostConnectionSpinner");
          const text = document.getElementById("lostConnectionText");
          spinner.className = "fas fa-spinner";
          if (!timer) {
            let countDown = 5;
            timer = true;
            setInterval(async () => {
              text.innerHTML =
                "Connection Restored! <br> Reloading the page automatically in " +
                countDown +
                " seconds...";
              text.innerHTML = `Connection Restored! <br> Automatically reloading the page in ${countDown} seconds... <br><br>
                                    <button id="reloadBtn" type="button" class="btn btn-success">Reload Now!</button>
                                `;
              document
                .getElementById("reloadBtn")
                .addEventListener("click", reloadWindow());
              countDown = countDown - 1;
            }, 1000);
            setTimeout(async () => {
              reloadWindow();
            }, 2500);
          }
        }
      } catch (e) {
        drawModal();
        console.error(e);
        clearInterval(interval);
        interval = false;
        serverAliveCheck();
      }
    }, 5000);
  }
};

serverAliveCheck();
