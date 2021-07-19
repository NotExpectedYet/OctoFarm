import Noty from "noty";

const printerSettingsModal = document.getElementById("printerSettingsModal");
const printerManagerModal = document.getElementById("printerManagerModal");
const printerLogsModal = document.getElementById("printerLogsModal");
const printerStatisticsModal = document.getElementById("printerStatistics");
const printerCustomGcodeScriptsModal = document.getElementById("printerCustomGcodeScriptsModal");
const printerSelectModal = document.getElementById("printerCustomGcodeScriptsModal");
const currentModals = [
  printerSettingsModal,
  printerManagerModal,
  printerLogsModal,
  printerStatisticsModal,
  printerCustomGcodeScriptsModal,
  printerSelectModal
];

export default class UI {
  //Colour function
  static getColour(state) {
    if (state === "Operational") {
      return { name: "secondary", hex: "#262626", category: "Idle" };
    } else if (state === "Paused") {
      return { name: "warning", hex: "#583c0e", category: "Idle" };
    } else if (state === "Printing") {
      return { name: "warning", hex: "#583c0e", category: "Active" };
    } else if (state === "Pausing") {
      return { name: "warning", hex: "#583c0e", category: "Active" };
    } else if (state === "Cancelling") {
      return { name: "warning", hex: "#583c0e", category: "Active" };
    } else if (state === "Error") {
      return { name: "danger", hex: "#2e0905", category: "Idle" };
    } else if (state === "Offline") {
      return { name: "danger", hex: "#2e0905", category: "Offline" };
    } else if (state === "Searching...") {
      return { name: "danger", hex: "#2e0905", category: "Idle" };
    } else if (state === "Closed") {
      return { name: "danger", hex: "#2e0905", category: "Closed" };
    } else if (state === "Complete") {
      return { name: "success", hex: "#00330e", category: "Complete" };
    } else {
      return { name: "danger", hex: "#2e0905", category: "Offline" };
    }
  }
  //Create message
  static createMessage(options, element) {
    const message = document.getElementById(element);
    const row = `
      <div class="alert alert-${options.type} alert-dismissible fade show" role="alert">
        ${options.msg}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    `;
    message.insertAdjacentHTML("beforeend", row);
  }

  //Create toast notification
  static createAlert(type, message, delay, click) {
    if (click != undefined) {
      click = ["click"];
    } else {
      click = [];
    }
    //This needs a more elegant solution, I think Noty is keeping the elements I remove with remove() from the DOM in memory somewhere...
    Noty.setMaxVisible(50);
    let alert = new Noty({
      type: type,
      theme: "bootstrap-v4",
      closeWith: click,
      timeout: delay,
      layout: "bottomRight",
      text: message
    });
    alert.show();
    return alert;
  }

  static doesElementNeedUpdating(value, element, meta) {
    //Quick check to see if the UI value differs, if so update.
    if (element) {
      if (JSON.stringify(value) !== JSON.stringify(element[meta])) {
        element[meta] = value;
      }
    }
  }

  static clearSelect(elementValue) {
    let inputBoxes = document.querySelectorAll("*[id^=" + elementValue + "]");
    inputBoxes.forEach((input) => {
      input.value = "";
    });
  }

  static addSelectListeners(elementValue) {
    let inputBoxes = document.querySelectorAll("*[id^=" + elementValue + "]");
    inputBoxes.forEach((input) => {
      input.addEventListener("focus", (e) => {
        if (input.value !== input.placeholder) {
          input.value = input.placeholder;
        }
      });
      input.addEventListener("focusout", (e) => {
        if (input.value !== input.placeholder) {
          input.placeholder = input.value;
        }
      });
    });
  }
  static removeLoaderFromElementInnerHTML(element) {
    if (element.innerHTML.includes("spinner")) {
      element.innerHTML = element.innerHTML.replace('<i class="fas fa-spinner fa-spin"></i>', "");
    }
  }
  static addLoaderToElementsInnerHTML(element) {
    if (!element.innerHTML.includes("spinner")) {
      element.innerHTML += ' <i class="fas fa-spinner fa-spin"></i>';
    }
  }
  static checkIfAnyModalShown() {
    const modalArray = currentModals.map((modal) => {
      return modal.classList.contains("show");
    });
    return modalArray.includes(true);
  }
  static checkIfSpecificModalShown(modalToCheck) {
    const currentModal = currentModals.filter((modal) => modal.id === modalToCheck);
    if (currentModal[0]) {
      return currentModal[0].classList.contains("show");
    } else {
      return false;
    }
  }
  static async delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  static removeLine(element) {
    element.remove();
  }
}
