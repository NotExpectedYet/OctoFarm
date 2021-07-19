const { AppConstants } = require("../app.constants");

// Default Settings
const onlinePolling = {
  seconds: 0.5
};

const server = {
  port: AppConstants.defaultOctoFarmPort,
  registration: true,
  loginRequired: true
};

const timeout = {
  apiTimeout: 1000,
  apiRetryCutoff: 10000,
  apiRetry: 30000,
  webSocketRetry: 5000
};

// TODO rename to filamentManagerEnabled
const filamentManager = false;

const history = {
  snapshots: {
    onFailure: true,
    onComplete: true
  },
  thumbnails: {
    onFailure: true,
    onComplete: true
  },
  timelapse: {
    onFailure: false,
    onComplete: false,
    deleteAfter: false
  }
};

const influxExport = {
  active: false,
  host: null,
  port: 8086,
  database: "OctoFarmExport",
  username: null,
  password: null,
  retentionPolicy: {
    duration: "365d",
    replication: 1,
    defaultRet: true
  }
};

const getDefaultSettings = () => ({
  onlinePolling,
  server,
  timeout,
  filamentManager,
  history,
  influxExport
});

module.exports = {
  influxExport,
  history,
  filamentManager,
  server,
  timeout,
  onlinePolling,
  getDefaultSettings
};
