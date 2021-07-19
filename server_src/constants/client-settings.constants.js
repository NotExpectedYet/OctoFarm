function getDefaultLayout() {
  return [
    { x: 0, y: 0, width: 2, height: 5, id: "currentUtil" },
    { x: 5, y: 0, width: 3, height: 5, id: "farmUtil" },
    { x: 8, y: 0, width: 2, height: 5, id: "averageTimes" },
    { x: 10, y: 0, width: 2, height: 5, id: "cumulativeTimes" },
    { x: 2, y: 0, width: 3, height: 5, id: "currentStat" },
    { x: 6, y: 5, width: 3, height: 5, id: "printerTemps" },
    { x: 9, y: 5, width: 3, height: 5, id: "printerUtilisation" },
    { x: 0, y: 5, width: 3, height: 5, id: "printerStatus" },
    { x: 3, y: 5, width: 3, height: 5, id: "printerProgress" },
    { x: 6, y: 10, width: 6, height: 9, id: "hourlyTemper" },
    { x: 0, y: 10, width: 6, height: 9, id: "weeklyUtil" },
    { x: 0, y: 19, width: 12, height: 8, id: "enviroData" },
    { x: 0, y: 19, width: 12, height: 8, id: "filamentUsageOverTime" },
    { x: 0, y: 19, width: 12, height: 8, id: "filamentUsageByDay" },
    { x: 0, y: 19, width: 12, height: 8, id: "historyCompletionByDay" }
  ];
}

function getDefaultDashboardSettings() {
  return {
    defaultLayout: getDefaultLayout(),
    savedLayout: [],
    farmActivity: {
      currentOperations: false,
      cumulativeTimes: true,
      averageTimes: true
    },
    printerStates: {
      printerState: true,
      printerTemps: true,
      printerUtilisation: true,
      printerProgress: true,
      currentStatus: true
    },
    farmUtilisation: {
      currentUtilisation: true,
      farmUtilisation: true
    },
    historical: {
      weeklyUtilisation: true,
      hourlyTotalTemperatures: false,
      environmentalHistory: false,
      filamentUsageOverTime: false,
      filamentUsageByDay: false,
      historyCompletionByDay: false
    }
  };
}

const getDefaultPanelViewSettings = () => ({
  currentOp: false,
  hideOff: true,
  hideClosed: false,
  extraInfo: false,
  powerBtn: false,
  webBtn: false
});

const getDefaultListViewSettings = () => ({
  currentOp: false,
  hideOff: true,
  hideClosed: false,
  extraInfo: false,
  powerBtn: false,
  webBtn: false
});

const getDefaultCameraViewSettings = () => ({
  currentOp: false,
  hideOff: true,
  hideClosed: false,
  extraInfo: false,
  powerBtn: false,
  webBtn: false
});

const getDefaultControlSettings = () => ({
  filesTop: false
});

const getDefaultSettings = () => ({
  dashboard: getDefaultDashboardSettings(),
  panelView: getDefaultPanelViewSettings(),
  listView: getDefaultListViewSettings(),
  cameraView: getDefaultCameraViewSettings(),
  controlSettings: getDefaultControlSettings()
});

module.exports = {
  getDefaultDashboardSettings,
  getDefaultPanelViewSettings,
  getDefaultListViewSettings,
  getDefaultCameraViewSettings,
  getDefaultControlSettings,
  getDefaultSettings
};
