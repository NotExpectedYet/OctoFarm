let { ServerSettingsMock } = jest.fn(
  "../../services/database/server-settings.service.js"
);

const mockCurrentServerSettings = {
  onlinePolling: { seconds: "0.5" },
  server: { port: 4000, loginRequired: true, registration: true },
  timeout: {
    apiTimeout: 1000,
    apiRetryCutoff: 10000,
    apiRetry: 30000,
    webSocketRetry: 5000
  },
  filament: { filamentCheck: false },
  history: {
    snapshot: { onComplete: false, onFailure: false },
    thumbnails: { onComplete: false, onFailure: false },
    timelapse: { onComplete: false, onFailure: false, deleteAfter: false }
  },
  influxExport: { active: false },
  filamentManager: false
};

ServerSettingsMock = () => {
  return {
    currentServerSettings: mockCurrentServerSettings,
    init: () => {
      this.currentServerSettings = mockCurrentServerSettings;
    },
    octoPrintFilamentManagerPluginSettings: () => {
      this.currentServerSettings = mockCurrentServerSettings["filamentManager"];
    }
  };
};

module.exports = {
  ServerSettingsMock
};
