const awilix = require("awilix");
const PrinterService = require("./services/printer.service");
const PrinterGroupService = require("./services/printer-group.service");
const PrintersStore = require("./state/printers.store");
const SettingsStore = require("./state/settings.store");
const ServerSettingsService = require("./services/server-settings.service");
const ClientSettingsService = require("./services/client-settings.service");
const OctoFarmManager = require("./state/octofarm.manager");
const OctofarmUpdateService = require("./services/octofarm-update.service");
const InfluxExportService = require("./services/influx-export.service");
const ScriptCheckService = require("./services/script-check.service");
const ScriptsService = require("./services/scripts.service");
const TaskManagerService = require("./services/task-manager.service");
const SystemInfoStore = require("./state/system-info.store");
const SystemCommandsService = require("./services/system-commands.service");
const ServerLogsService = require("./services/server-logs.service");
const SystemInfoBundleService = require("./services/system-info-bundle.service");
const GithubClientService = require("./services/github-client.service");
const HistoryService = require("./services/history.service");
const FarmStatisticsService = require("./services/farm-statistics.service");
const PrinterClean = require("./state/data/printerClean");
const FileClean = require("./state/data/fileClean");
const HistoryCache = require("./state/data/history.cache");
const JobClean = require("./state/data/jobClean");
const UserTokenService = require("./services/authentication/user-token.service");
const { AppConstants } = require("./app.constants");

// Create the container and set the injectionMode to PROXY (which is also the default).
const container = awilix.createContainer({
  injectionMode: awilix.InjectionMode.PROXY
});

container.register({
  serverVersion: awilix.asValue(
    process.env[AppConstants.VERSION_KEY] || AppConstants.defaultOctoFarmPageTitle
  ),
  octoFarmPageTitle: awilix.asValue(process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY]),

  // Here we are telling Awilix how to resolve a
  // printerService: by instantiating a class.
  settingsStore: awilix.asClass(SettingsStore).singleton(),
  serverSettingsService: awilix.asClass(ServerSettingsService),
  clientSettingsService: awilix.asClass(ClientSettingsService),
  userTokenService: awilix.asClass(UserTokenService).singleton(),

  taskManagerService: awilix.asClass(TaskManagerService).singleton(),
  octofarmUpdateService: awilix.asClass(OctofarmUpdateService).singleton(),
  systemInfoStore: awilix.asClass(SystemInfoStore).singleton(),
  octofarmManager: awilix.asClass(OctoFarmManager),
  githubClientService: awilix.asClass(GithubClientService),
  systemCommandsService: awilix.asClass(SystemCommandsService),
  serverLogsService: awilix.asClass(ServerLogsService),
  systemInfoBundleService: awilix.asClass(SystemInfoBundleService),

  printerService: awilix.asClass(PrinterService),
  printerGroupService: awilix.asClass(PrinterGroupService),
  printersStore: awilix.asClass(PrintersStore).singleton(),
  farmStatisticsService: awilix.asClass(FarmStatisticsService),
  printerClean: awilix.asClass(PrinterClean).singleton(),
  fileClean: awilix.asClass(FileClean).singleton(),
  historyCache: awilix.asClass(HistoryCache).singleton(),
  // Needs a bit of a nudge to become a singleton (it constructs things itself now)
  // historyClean: awilix.asClass(HistoryClean).singleton(),
  historyService: awilix.asClass(HistoryService),
  jobClean: awilix.asClass(JobClean),

  influxSetupService: awilix.asClass(InfluxExportService).singleton(),
  scriptCheckService: awilix.asClass(ScriptCheckService),
  scriptsService: awilix.asClass(ScriptsService)
});

module.exports = container;
