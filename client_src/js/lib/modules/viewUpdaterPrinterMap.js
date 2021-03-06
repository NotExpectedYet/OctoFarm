import {dragAndDropEnable, dragAndDropEnableMultiplePrinters, dragCheck} from "../functions/dragAndDrop.js";
import PrinterManager from "./printerManager.js";
import UI from "../functions/ui.js";
import currentOperations from "./currentOperations";
import OctoFarmclient from "../octofarm";

// Group parsing constants
const groupStartNames = ['rij', 'row', 'group', 'groep'];
const selectableTilePrefix = 'panel-selectable';
const massDragAndDropId = 'mass-drag-and-drop';
const massDragAndDropStatusId = 'mass-drag-and-drop-status';
const groupSplitString = '_';
const gutterHalfSize = '5px'; // Be conservative! Keep small screen in mind.
const blockCountMax = 3; // Indices 0,1,2,3 allowed
const groupsPerGallery = 4; // Square blocks of 2x2 printers, in Y direction
const galleries = 2;
const groupWidth = 2; // Used to translate gallery coordinates to real X
const groupHeight = 2;
const mapRealLimits = [galleries * groupWidth, groupsPerGallery * groupHeight];

const elems = [];
let powerTimer = 20000;
let printerInfo = null;
let printerControlList = null;
let worker = null;
let controlModal = false;
let printerManagerModal = document.getElementById("printerManagerModal");
let printerArea = document.getElementById("printerArea");
let currentView = null;

document.addEventListener("visibilitychange", handleVisibilityChange, false);
document.getElementById("filterStates").addEventListener("change", (e) => {
  OctoFarmclient.get("client/updateFilter/" + e.target.value);
});
document.getElementById("sortStates").addEventListener("change", (e) => {
  OctoFarmclient.get("client/updateSorting/" + e.target.value);
});

function parseGroupLocation(printer) {
  if (!printer.group || typeof printer.group !== 'string') {
    throw new Error('Printer group not a string. Contact DEV~ID.');
  }
  let hasGroupStartName = false;
  let printerGroupCut = '';

  for (var i = 0; i < groupStartNames.length; i++) {
    if (printer.group.toLowerCase().indexOf(groupStartNames[i]) > -1) {
      hasGroupStartName = true;
      printerGroupCut = printer.group.toLowerCase().replace(groupStartNames[i], '');
    }
  }

  if (!hasGroupStartName) {
    throw new Error(`Printer group does not meet convention (value: ${printer.group}). Contact DEV~ID.`);
  }
  const splitPrinterGroupName = printerGroupCut.split(groupSplitString);
  if (!splitPrinterGroupName?.length > 1) {
    throw new Error(`Printer group name is not according to x_x location convention. Contact DEV~ID.`);
  }
  return splitPrinterGroupName.map(gn => parseInt(gn));
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
      createWebWorker(currentView);
    }
  }
}

const returnPrinterInfo = (id) => {
  if (typeof id !== "undefined") {
    const zeeIndex = _.findIndex(printerInfo, function (o) {
      return o._id == id;
    });
    return printerInfo[zeeIndex];
  } else {
    return printerInfo;
  }
};
export default function createWebWorker(view) {
  currentView = view;
  worker = new Worker("/assets/js/workers/monitoringViewsWorker.min.js");
  worker.onmessage = async function (event) {
    if (event.data != false) {
      //Update global variables with latest information...
      printerInfo = event.data.printersInformation;
      printerControlList = event.data.printerControlList;
      //Grab control modal element...
      if (!controlModal) {
        controlModal = document.getElementById("printerManagerModal");
      }
      await init(
        event.data.printersInformation,
        event.data.clientSettings,
        currentView,
      );
      if (event.data.clientSettings.panelView.currentOp) {
        const currentOperationsData = event.data.currentOperations;
        currentOperations(
          currentOperationsData.operations,
          currentOperationsData.count,
          printerInfo,
        );
      }
    }
  };
}

function cleanPrinterName(printer) {
  if (!printer) {
    return '';
  }
  const printerName = printer.printerName;
  let name = printerName;
  if (name.includes("http://")) {
    name = name.replace("http://", "");
  } else if (name.includes("https://")) {
    name = name.replace("https://", "");
  }
  return `${name}`;
}

function checkPrinterRows(clientSettings) {
  if (
    typeof clientSettings !== "undefined" &&
    typeof clientSettings.panelView !== "undefined" &&
    typeof clientSettings.panelView.printerRows !== "undefined"
  ) {
    return clientSettings.panelView.printerRows;
  } else {
    return 2;
  }
}

function massDragAndDropPanel() {
  return `
  <div class="col-12">
    <div class="card" id="${massDragAndDropId}">
      <div class="card-header dashHeader">
        <strong>Drag a file here to mass print</strong>
      </div>
      <div class="card-body pt-1 pb-0 pl-2 pr-2">
        <div id="${massDragAndDropStatusId}">
          Currently 0 printers selected. No use in dropping file in this state.
        </div>
      </div>
    </div>
  </div>
  `;
}

function drawPanelView(printer, realCoord, clientSettings, isLeftOfGutter, isRightOfGutter, markState) {
  const printerLoc = `<strong>${realCoord[0]} ${realCoord[1]}</strong>`;
  const name = cleanPrinterName(printer);
  const gutterStyle = isLeftOfGutter ? `style="margin-right:${gutterHalfSize}; margin-left:-${gutterHalfSize};"` : (isRightOfGutter ? `style="margin-right:-${gutterHalfSize}; margin-left:${gutterHalfSize};"` : "");
  const stubOrNotClass = (!!printer.stub) ? 'printer-map-tile-stub' : 'printer-map-tile';
  return `
      <div class="col-sm-3 col-md-3 col-lg-3 col-xl-3 ${stubOrNotClass} ${markState}" id="panel-${printer._id}" ${gutterStyle}>
        <div class="card mt-1 mb-1 ml-1 mr-1 text-center ${printer.printerState?.colour.category}" id="${selectableTilePrefix}-${printer._id}">
          <div class="card-header dashHeader">
           <span id="name-${printer._id}" class="mb-0 btn-sm float-left">
                ${name}
            </span>
            <span id="coord-X${realCoord[0]}-Y{${realCoord[1]}" class="mb-0 btn-sm float-right">
              ${printerLoc}
            </span>
          </div>
          <div class="card-body pt-1 pb-0 pl-2 pr-2">
            <div class="progress">
              <div
                id="progress-${printer._id}"
                class="progress-bar progress-bar-striped bg-${printer.printerState?.colour.name} percent"
                role="progressbar progress-bar-striped"
                style="width: 0%"
                aria-valuenow="0"
                aria-valuemin="0"
                aria-valuemax="100">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
}

function addListeners(printer, allPrinters) {
  printer.isSelected = false;
  let panel = document.getElementById(`${selectableTilePrefix}-${printer._id}`);
  if (panel) {
    panel.addEventListener("click", (e) => {
      const tokenPresent = panel.classList.toggle('printer-map-tile-selected');
      printer.isSelected = tokenPresent;

      const massDragAndDropStatusPanel = document.getElementById(massDragAndDropStatusId);
      if (massDragAndDropStatusPanel) {
        const selectedPrinterCount = allPrinters.filter(p => !!p.isSelected)?.length;
        if (selectedPrinterCount === 0) {
          massDragAndDropStatusPanel.innerHTML = `Currently ${selectedPrinterCount} printers selected. No use in dropping file in this state.`;
        } else {
          massDragAndDropStatusPanel.innerHTML = `Currently ${selectedPrinterCount} printers selected. Time to print!`;
        }
      } else {
        throw new Error("Element not found! ID: " + massDragAndDropStatusPanel);
      }
    });
  } else {
    throw new Error(`Could not find the printer panel to add listeners to, id: ${selectableTilePrefix}-${printer._id}`);
  }
  return "done";
}

function grabElements(printer) {
  if (typeof elems[printer._id] !== "undefined") {
    return elems[printer._id];
  } else {
    elems[printer._id] = {
      row: document.getElementById("panel-" + printer._id),
      name: document.getElementById("name-" + printer._id),
      currentFile: document.getElementById("currentFile-" + printer._id),
      state: document.getElementById("state-" + printer._id),
      progress: document.getElementById("progress-" + printer._id),
    };
    return elems[printer._id];
  }
}

async function updateState(printer, clientSettings, view) {
  //Grab elements on page
  const elements = grabElements(printer);
  if (typeof elements.row === "undefined") return; //Doesn't exist can skip updating

  //Check display and skip if not displayed...
  if (printer.display) {
    if (elements.row.style.display === "none") {
      switch (view) {
        case "list":
          elements.row.style.display = "table";
          break;
        case "panel":
          elements.row.style.display = "block";
          break;
      }
    }
  } else {
    if (elements.row.style.display !== "none") {
      elements.row.style.display = "none";
    }
    return;
  }

  let stateCategory = printer.printerState.colour.category;
  if (stateCategory === "Error!") {
    stateCategory = "Offline";
  }
  UI.doesElementNeedUpdating(
    cleanPrinterName(printer),
    elements.name,
    "innerHTML",
  );

  switch (view) {
    case "list":
      UI.doesElementNeedUpdating(stateCategory, elements.row, "classList");
      break;
    case "panel":
      UI.doesElementNeedUpdating(
        `btn btn-block ${stateCategory} mb-1 mt-1`,
        elements.state,
        "classList",
      );
      break;
  }

  //Progress
  UI.doesElementNeedUpdating(
    `progress-bar progress-bar-striped bg-${printer.printerState.colour.name}`,
    elements.progress,
    "classList",
  );
  if (typeof printer.currentJob !== "undefined") {
    let progress = 0;
    if (typeof printer.currentJob.progress === "number") {
      progress = printer.currentJob.progress.toFixed(0);
    }
    UI.doesElementNeedUpdating(progress + "%", elements.progress, "innerHTML");
    elements.progress.style.width = progress + "%";
  } else {
    let printTimeElapsedFormat = ``;
    let remainingPrintTimeFormat = ``;
    //No Job reset
    UI.doesElementNeedUpdating("", elements.progress, "innerHTML");
    elements.progress.style.width = 0 + "%";
    UI.doesElementNeedUpdating(
      printTimeElapsedFormat,
      elements.printTimeElapsed,
      "innerHTML",
    );
    UI.doesElementNeedUpdating(
      remainingPrintTimeFormat,
      elements.remainingPrintTime,
      "innerHTML",
    );
  }
}

function findPrinterWithBlockCoordinate(parsedPrinters, coordinateXY) {
  if (!parsedPrinters) {
    return false;
  }
  return parsedPrinters.find(pm => pm?.realCoord[0] === coordinateXY[0] && pm?.realCoord[1] === coordinateXY[1]);
}

function convertPrinterNameToXYCoordinate(printer) {
  if (!printer)
    return [-1, -1];
  const printerName = printer.printerName;
  const splitNamePort = printerName.split(':');
  if (!splitNamePort?.length > 1) {
    return [-1, -1];
  }
  const parsedPort = parseInt(splitNamePort[2]) % 10;
  if (parsedPort > blockCountMax) {
    console.warn("This printer's port is not recognizable in the 0,1,2,3 block index. Contact DEV~ID.");
    return [-1, -1];
  }
  // Y (0;1)
  // ^
  // [3; 0]
  // [2; 1] > X (0;1)
  return [parsedPort < 2 ? 1 : 0, parsedPort === 3 || parsedPort === 0 ? 1 : 0];
}

function combineSubAndNormalCoords(coord, subCoord) {
  return [coord[0] * groupWidth + subCoord[0], coord[1] * groupHeight + subCoord[1]];
}

async function init(printers, clientSettings, view) {
  //Check if printer manager modal is opened
  switch (printerManagerModal.classList.contains("show")) {
    case true:
      // Run printer manager updater
      PrinterManager.init("", printers, printerControlList);
      break;
    case false:
      let massDragAndDropPanelDom = document.getElementById(massDragAndDropId);
      if (!massDragAndDropPanelDom) {
        const panelHtml = massDragAndDropPanel();
        printerArea.insertAdjacentHTML("beforeend", panelHtml);

        // Attach drag and drop to mass upload
        massDragAndDropPanelDom = document.getElementById(massDragAndDropId);
        await dragAndDropEnableMultiplePrinters(massDragAndDropPanelDom, printers);
      }

      // initialise or start the information updating..
      const parsedPrinters = [...printers.map(p => {
        const parsedGroupCoord = parseGroupLocation(p);
        const printerSubCoordinate = convertPrinterNameToXYCoordinate(p);
        return {
          printer: p,
          coord: parsedGroupCoord,
          subCoord: printerSubCoordinate,
          realCoord: combineSubAndNormalCoords(parsedGroupCoord, printerSubCoordinate),
        };
      })];
      for (let realY = mapRealLimits[1] - 1; realY >= 0; realY--) {
        for (let realX = 0; realX < mapRealLimits[0]; realX++) {
          const printerWithCoord = findPrinterWithBlockCoordinate(parsedPrinters, [realX, realY]);
          const printer = null;
          if (!printerWithCoord) {
            // We construct a fakey
            printer = {
              _id: `X${realX}Y${realY}STUB`,
              stub: true,
              printerName: '',
              printerState: {
                colour: {
                  name: 'red',
                },
                state: '',
              },
              display: true,
            };
          } else {
            printer = printerWithCoord.printer;
          }

          let printerPanel = document.getElementById("panel-" + printer._id);
          if (!printerPanel) {
            let printerHTML = await drawPanelView(
              printer,
              [realX, realY],
              clientSettings,
              realX === groupWidth - 1, // Left of gutter (f.e. X=1 of 0,1,2,3)
              realX === groupWidth, // Right of gutter ((f.e. X=2 of 0,1,2,3)
            );
            printerArea.insertAdjacentHTML("beforeend", printerHTML);

            //Update the printer panel to the actual one
            printerPanel = document.getElementById("panel-" + printer._id);
            //Add page listeners
            if (!printer.stub) {
              addListeners(printer, printers);
            }
            //Grab elements
            await grabElements(printer);
            //Initialise Drag and Drop
            await dragAndDropEnable(printerPanel, printer);
          } else {
            if (!printerManagerModal.classList.contains("show")) {
              if (!(await dragCheck())) {
                await updateState(printer, clientSettings, view);
              }
              if (powerTimer >= 20000) {
                // Fuk dat, we dont used the buttons but the timer can be nice for anything else
                powerTimer = 0;
              } else {
                powerTimer += 500;
              }
            }
          }
        }
      }
      break;
  }
}
