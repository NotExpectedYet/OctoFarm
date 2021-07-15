const getWolPowerSubSettingsDefault = () => {
  return {
    enabled: false,
    ip: "255.255.255.0",
    packets: "3",
    port: "9",
    interval: "100",
    MAC: ""
  };
};

const getPowerSettingsDefault = () => {
  return {
    powerOnCommand: "",
    powerOnURL: "",
    powerOffCommand: "",
    powerOffURL: "",
    powerToggleCommand: "",
    powerToggleURL: "",
    powerStatusCommand: "",
    powerStatusURL: "",
    wol: getWolPowerSubSettingsDefault()
  };
};

const getCostSettingsDefault = () => {
  return {
    powerConsumption: 0.5,
    electricityCosts: 0.15,
    purchasePrice: 500,
    estimateLifespan: 43800,
    maintenanceCosts: 0.25
  };
};

const getFilterDefaults = () => [
  "All Printers",
  "State: Idle",
  "State: Active",
  "State: Complete",
  "State: Disconnected"
];

const getSystemChecksDefault = () => {
  return {
    api: {
      status: "danger",
      date: null
    },
    files: {
      status: "danger",
      date: null
    },
    state: {
      status: "danger",
      date: null
    },
    profile: {
      status: "danger",
      date: null
    },
    settings: {
      status: "danger",
      date: null
    },
    system: {
      status: "danger",
      date: null
    }
  };
};

const mapStateToColor = (state) => {
  if (state === "Operational") {
    return { name: "secondary", hex: "#262626", category: "Idle" };
  }
  if (state === "Paused") {
    return { name: "warning", hex: "#583c0e", category: "Idle" };
  }
  if (state === "Printing") {
    return { name: "warning", hex: "#583c0e", category: "Active" };
  }
  if (state === "Pausing") {
    return { name: "warning", hex: "#583c0e", category: "Active" };
  }
  if (state === "Cancelling") {
    return { name: "warning", hex: "#583c0e", category: "Active" };
  }
  if (state === "Starting") {
    return { name: "warning", hex: "#583c0e", category: "Active" };
  }
  if (state === "Error!") {
    return { name: "danger", hex: "#2e0905", category: "Error!" };
  }
  if (state === "Offline") {
    return { name: "danger", hex: "#2e0905", category: "Offline" };
  }
  if (state === "Searching...") {
    return { name: "danger", hex: "#2e0905", category: "Offline" };
  }
  if (state === "Disconnected") {
    return { name: "danger", hex: "#2e0905", category: "Disconnected" };
  }
  if (state === "No-API") {
    return { name: "danger", hex: "#2e0905", category: "Offline" };
  }
  if (state === "Complete") {
    return { name: "success", hex: "#00330e", category: "Complete" };
  }
  if (state === "Shutdown") {
    return { name: "danger", hex: "#2e0905", category: "Offline" };
  }
  if (state === "Online") {
    return { name: "success", hex: "#00330e", category: "Idle" };
  }
  if (state === "Offline after error") {
    return { name: "danger", hex: "#2e0905", category: "Error!" };
  }
  return { name: "warning", hex: "#583c0e", category: "Active" };
};

module.exports = {
  getPowerSettingsDefault,
  getWolPowerSubSettingsDefault,
  getSystemChecksDefault,
  getCostSettingsDefault,
  getFilterDefaults,
  mapStateToColor
};
