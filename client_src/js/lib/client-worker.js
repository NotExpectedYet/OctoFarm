import UI from "./functions/ui.js";

let worker = null;
let savedWorkerEventFunction = null;
let currentFileURL = null;
const workerResource = "/assets/dist/sse.client.min.js";

function webWorkerFunction(url, workerEventFunction) {
  worker = new Worker(workerResource);
  worker.postMessage({ url: url });
  worker.onmessage = function (event) {
    if (!!event.data) {
      workerEventFunction(event.data);
    }
  };
}

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    if (worker !== null) {
      console.log("Screen Abandonded, closing web worker...");
      worker.terminate();
      worker = null;
    }
  } else {
    if (worker === null) {
      console.log("Screen resumed... opening web worker...");
      webWorkerFunction(currentFileURL, savedWorkerEventFunction);
    }
  }
}

export function createClientSSEWorker(url, workerEventFunction) {
  if (window.Worker) {
    // Yes! Web worker support!
    try {
      if (worker === null) {
        savedWorkerEventFunction = workerEventFunction;
        currentFileURL = url;
        webWorkerFunction(url, workerEventFunction);
      }
    } catch (e) {
      UI.createAlert(
        "error",
        "Sorry web workers are not supported in your browser, please check the supported browser list.",
        0
      );
      console.error(
        `Couldn't create the web worker, please log a github issue... <br> ${e}`
      );
    }
  } else {
    // Sorry! No Web Worker support..
    UI.createAlert(
      "error",
      "Sorry web workers are not supported in your browser, please check the supported browser list.",
      0
    );
    console.error(`Web workers not available... sorry! <br> ${e}`);
  }
  document.addEventListener("visibilitychange", handleVisibilityChange, false);
}
