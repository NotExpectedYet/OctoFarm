import Calc from "./lib/functions/calc.js";

import OctoPrintClient from "./lib/octoprint.js";

import UI from "./lib/functions/ui.js";

let worker = null;

function createWebWorker() {
  worker = new Worker("/assets/dist/monitoringViewsWorker.min.js");
  worker.onmessage = async function (event) {
    if (event.data != false) {
      // /printerInfo === event.data.printersInformation
      currentOperationsView(
        event.data.currentOperations.operations,
        event.data.currentOperations.count,
        event.data.printersInformation
      );
    } else {
      UI.createAlert(
        "warning",
        "Communication with the server has been suddenly lost, trying to re-establish connection...",
        10000,
        "Clicked"
      );
    }
  };
}
function handleVisibilityChange() {
  if (document.hidden) {
    if (worker !== null) {
      console.log("Screen Abandonded, closing web worker...");
      worker.terminate();
      worker = null;
    }
  } else {
    if (worker === null) {
      console.log("Screen resumed... opening web worker...");
      createWebWorker();
    }
  }
}

document.addEventListener("visibilitychange", handleVisibilityChange, false);

// Setup webWorker
if (window.Worker) {
  // Yes! Web worker support!
  try {
    if (worker === null) {
      createWebWorker();
    }
  } catch (e) {
    console.log(e);
  }
} else {
  // Sorry! No Web Worker support..
  console.log("Web workers not available... sorry!");
}

let printers = [];
const resetFile = function (id) {
  const i = _.findIndex(printers, function (o) {
    return o._id == id;
  });
  OctoPrintClient.file(printers[i], printers[i].currentJob.filePath, "load");
};
const rePrint = function (id) {
  const i = _.findIndex(printers, function (o) {
    return o._id == id;
  });
  OctoPrintClient.file(printers[i], printers[i].currentJob.filePath, "print");
};
const currentHarvest = document.querySelectorAll("[id^='currentHarvest-']");
currentHarvest.forEach((harvest) => {
  harvest.addEventListener("click", (e) => {
    const id = harvest.id.split("-");
    document.getElementById("viewPanel-" + id[1]).style.display = "none";
    resetFile(id[1]);
  });
});
const currentRestartPrint = document.querySelectorAll(
  "[id^='restartCurrentPrint-']"
);
currentRestartPrint.forEach((harvest) => {
  harvest.addEventListener("click", (e) => {
    const id = harvest.id.split("-");
    rePrint(id[1]);
  });
});
function currentOperationsView(
  currentOperations,
  currentOperationsCount,
  printerInfo
) {
  printers = printerInfo;
  if (currentOperations.length === 0) {
    const currentCards = document.querySelectorAll("[id^='currentOpCard-']");
    currentCards.forEach((card) => {
      const id = cardt.id.split("-");
    });
  }

  document.getElementById("completeCount").innerHTML =
    "Complete: " + currentOperationsCount.complete;
  document.getElementById("idleCount").innerHTML =
    "Idle: " + currentOperationsCount.idle;
  document.getElementById("activeCount").innerHTML =
    "Active: " + currentOperationsCount.active;
  document.getElementById("disconCount").innerHTML =
    "Disconnected: " + currentOperationsCount.disconnected;

  document.getElementById("offlineCount").innerHTML =
    "Offline: " + currentOperationsCount.offline;

  document.getElementById("farmProgress").innerHTML =
    currentOperationsCount.farmProgress + "%";
  document.getElementById(
    "farmProgress"
  ).style = `width: ${currentOperationsCount.farmProgress}%`;
  document.getElementById(
    "farmProgress"
  ).classList = `progress-bar progress-bar-striped bg-${currentOperationsCount.farmProgressColour}`;

  currentOperations = _.orderBy(currentOperations, ["progress"], ["desc"]);

  currentOperations.forEach((current, index) => {
    // Generate future time
    let currentDate = new Date();
    currentDate = currentDate.getTime();
    const futureDateString = new Date(
      currentDate + current.timeRemaining * 1000
    ).toDateString();
    let futureTimeString = new Date(
      currentDate + current.timeRemaining * 1000
    ).toTimeString();
    futureTimeString = futureTimeString.substring(0, 8);
    const dateComplete = futureDateString + ": " + futureTimeString;
    const finishedPrint = `<button id='currentHarvest-${current.index}' type='button' title="Clear your finished print from current operations" class='tag btn btn-success btn-sm mt-0 pt-0 pb-0'>Print Harvested?</button>`;
    const restartPrint = `<button id='restartCurrentPrint-${current.index}' type='button' title="Restart your current selected print" class='tag btn btn-warning btn-sm mt-0 pt-0 pb-0'>Restart Print</button>`;
    // check if exists, create if not....
    let fileName = null;
    if (typeof current.fileName !== undefined) {
      fileName = current.fileName.replace(".gcode", "");
      if (fileName.length > 15) {
        fileName.substring(0, 16);
      }
    }
    if (document.getElementById("currentOpCard-" + current.index)) {
      document.getElementById("viewPanel-" + current.index).style.display =
        "inline-block";
      if (current.progress === 100) {
        document
          .getElementById("finishedPrint-" + current.index)
          .classList.remove("d-none");
        document
          .getElementById("futureDate-" + current.index)
          .classList.add("d-none");
        document
          .getElementById("currentRestart-" + current.index)
          .classList.remove("d-none");
        document
          .getElementById("currentTime-" + current.index)
          .classList.add("d-none");
        document
          .getElementById("currentProgressMain-" + current.index)
          .classList.add("d-none");
      } else {
        document
          .getElementById("finishedPrint-" + current.index)
          .classList.add("d-none");
        document
          .getElementById("futureDate-" + current.index)
          .classList.remove("d-none");
        document
          .getElementById("currentRestart-" + current.index)
          .classList.add("d-none");
        document
          .getElementById("currentTime-" + current.index)
          .classList.remove("d-none");
        document
          .getElementById("currentProgressMain-" + current.index)
          .classList.remove("d-none");
      }
      const progress = document.getElementById(
        "currentProgress-" + current.index
      );
      document.getElementById("currentTime-" + current.index).innerHTML =
        Calc.generateTime(current.timeRemaining);
      progress.style = `width: ${current.progress}%`;
      progress.innerHTML = current.progress + "%";
      progress.className = `progress-bar progress-bar-striped bg-${current.progressColour}`;
    } else {
      document.getElementById("currentOperationsBody").insertAdjacentHTML(
        "beforeend",
        `
            <div class="col-2 pt-0 pb-0" id="viewPanel-${current.index}">
                <div id="currentOpCard-${current.index}"
                class="card card-block text-white bg-secondary d-inline-block"
                 style="width:100%;"
              >
                  <div class="card-header pb-1 pt-1 pl-2 pr-2">
                     ${current.name}</div>
                  <div class="card-body pb-0 pt-2 pl-2 pr-2 pb-1">
                  <h6 id="currentFile-${
                    current.index
                  }" class="pb-0 text-center" style="font-size:0.6rem;"> ${fileName} </h6>
                  <h6 id="currentRestart-${
                    current.index
                  }" class="pb-0 text-center d-none" style="font-size:0.6rem;">${restartPrint}</h6>
                  <h6 id="currentTime-${
                    current.index
                  }" class="pb-0 text-center" style="font-size:0.6rem;">${Calc.generateTime(
          current.timeRemaining
        )}</h6>
        <h6 id="futureDate-${
          current.index
        }" class="pb-0 text-center" style="font-size:0.6rem;"> ${dateComplete} </h6>
        <h6 id="finishedPrint-${
          current.index
        }" class="pb-0 text-center d-none" style="font-size:0.6rem;"> ${finishedPrint} </h6>
                    <div id="currentProgressMain-${
                      current.index
                    }" class="progress">
                      <div id="currentProgress-${current.index}"
                        class="progress-bar progress-bar-striped bg-${
                          current.progressColour
                        }"
                        role="progressbar"
                        style="width: ${current.progress}%"
                        aria-valuenow="${current.progress}"
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                      ${current.progress}%
                      </div>
                    </div>
                  </div>
                </div>
                `
      );
      document
        .getElementById("currentHarvest-" + current.index)
        .addEventListener("click", (e) => {
          const id = document
            .getElementById("currentHarvest-" + current.index)
            .id.split("-");
          resetFile(id[1]);
        });
      document
        .getElementById("restartCurrentPrint-" + current.index)
        .addEventListener("click", (e) => {
          const id = document
            .getElementById("restartCurrentPrint-" + current.index)
            .id.split("-");
          rePrint(id[1]);
        });
    }

    document.getElementById("currentOpCard-" + current.index).style.order =
      index;
    const currentCards = document.querySelectorAll("[id^='currentOpCard-']");
    const curr = [];
    currentOperations.forEach((cur) => {
      curr.push(cur.index);
    });
    const cards = [];
    currentCards.forEach((card) => {
      const ca = card.id.split("-");
      cards.push(ca[1]);
    });
    const remove = _.difference(cards, curr);
    remove.forEach((rem) => {
      document.getElementById("viewPanel-" + rem).style.display = "none";
    });
  });
}
