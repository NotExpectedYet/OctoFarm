const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth.js");
const { getServerSettingsCache } = require("../cache/server-settings.cache.js");
const prettyHelpers = require("../../views/partials/functions/pretty.js");
const runner = require("../runners/state.js");
const { Runner } = runner;
const _ = require("lodash");
const filamentClean = require("../lib/dataFunctions/filamentClean.js");
const { FilamentClean } = filamentClean;
const settingsClean = require("../lib/dataFunctions/settingsClean.js");
const { SettingsClean } = settingsClean;
const printerClean = require("../lib/dataFunctions/printerClean.js");
const { PrinterClean } = printerClean;
const fileClean = require("../lib/dataFunctions/fileClean.js");
const { FileClean } = fileClean;
const { getSorting, getFilter } = require("../lib/sorting.js");
const softwareUpdateChecker = require("../runners/softwareUpdateChecker");
const { AppConstants } = require("../app.constants");
const { initHistoryCache } = require("../cache/history.cache");
const {
  getDefaultDashboardSettings
} = require("../lib/providers/settings.constants");
const { getHistoryCache } = require("../cache/history.cache");

const version = process.env[AppConstants.VERSION_KEY];

// Welcome Page
router.get("/", async (req, res) => {
  if (!getServerSettingsCache().systemSettings.loginRequired) {
    res.redirect("/dashboard");
  } else {
    if (req.isAuthenticated()) {
      res.redirect("/dashboard");
    } else {
      res.render("welcome", {
        page: "Welcome",
        octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
        registration: getServerSettingsCache().systemSettings.registration
      });
    }
  }
});

// Dashboard Page
router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters();
  const clientSettings = await SettingsClean.returnClientSettings();
  const dashStatistics = await PrinterClean.returnDashboardStatistics();
  let dashboardSettings =
    clientSettings?.dashboard || getDefaultDashboardSettings();

  res.render("dashboard", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printerCount: printers.length,
    page: "Dashboard",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    dashboardSettings: dashboardSettings,
    dashboardStatistics: dashStatistics
  });
});
router.get("/printers", ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters();
  res.render("printerManagement", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    page: "Printer Manager",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    printerCount: printers.length,
    helpers: prettyHelpers
  });
});
// File Manager Page
router.get("/filemanager", ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters();
  const currentOperations = await PrinterClean.returnCurrentOperations();
  const fileStatistics = await FileClean.returnStatistics();
  res.render("filemanager", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    page: "Printer Manager",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    printerCount: printers.length,
    helpers: prettyHelpers,
    currentOperationsCount: currentOperations.count,
    fileStatistics
  });
});
// History Page
router.get("/history", ensureAuthenticated, async (req, res) => {
  const printers = Runner.returnFarmPrinters();
  const historyCache = getHistoryCache();
  const history = historyCache.historyClean;
  const statistics = historyCache.statisticsClean;

  res.render("history", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printerCount: printers.length,
    history,
    printStatistics: statistics,
    helpers: prettyHelpers,
    page: "History",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY]
  });
});

// Panel view  Page
router.get("/mon/panel", ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters();
  const sortedIndex = await Runner.sortedIndex();
  const clientSettings = await SettingsClean.returnClientSettings();
  const dashStatistics = await PrinterClean.returnDashboardStatistics();
  const currentSort = getSorting();
  const currentFilter = getFilter();

  let printGroups = await Runner.returnGroupList();
  if (typeof printGroups === "undefined") {
    printGroups = [];
  }

  res.render("panelView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
    page: "Panel View",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    clientSettings,
    printGroups,
    currentChanges: { currentSort, currentFilter },
    dashboardStatistics: dashStatistics
  });
});
// Camera view  Page
router.get("/mon/camera", ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters();
  const sortedIndex = await Runner.sortedIndex();
  const clientSettings = await SettingsClean.returnClientSettings();
  const dashStatistics = await PrinterClean.returnDashboardStatistics();
  const currentSort = getSorting();
  const currentFilter = getFilter();

  let printGroups = await Runner.returnGroupList();
  if (!printGroups) {
    printGroups = [];
  }

  res.render("cameraView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
    page: "Camera View",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    clientSettings,
    printGroups,
    currentChanges: { currentSort, currentFilter },
    dashboardStatistics: dashStatistics
  });
});
router.get("/mon/printerMap", ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters();
  const sortedIndex = await Runner.sortedIndex();
  const clientSettings = await SettingsClean.returnClientSettings();

  const currentSort = getSorting();
  const currentFilter = getFilter();

  let printGroups = await Runner.returnGroupList();
  if (typeof printGroups === "undefined") {
    printGroups = [];
  }

  res.render("printerMap", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
    page: "Printer Map",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    clientSettings,
    printGroups,
    currentChanges: { currentSort, currentFilter }
  });
});
// List view  Page
router.get("/mon/list", ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters();
  const sortedIndex = await Runner.sortedIndex();
  const clientSettings = await SettingsClean.returnClientSettings();
  const dashStatistics = await PrinterClean.returnDashboardStatistics();
  const currentSort = getSorting();
  const currentFilter = getFilter();

  let printGroups = await Runner.returnGroupList();
  if (typeof printGroups === "undefined") {
    printGroups = [];
  }

  res.render("listView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
    page: "List View",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    clientSettings,
    printGroups,
    currentChanges: { currentSort, currentFilter },
    dashboardStatistics: dashStatistics
  });
});
router.get("/mon/currentOp", ensureAuthenticated, async (req, res) => {
  const printers = await Runner.returnFarmPrinters();
  const sortedIndex = await Runner.sortedIndex();
  const clientSettings = await SettingsClean.returnClientSettings();

  res.render("currentOperationsView", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printers,
    printerCount: printers.length,
    sortedIndex,
    page: "Current Operations",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    clientSettings
  });
});
router.get("/filament", ensureAuthenticated, async (req, res) => {
  const historyCache = getHistoryCache();
  const historyStats = historyCache.generateStatistics();

  const printers = Runner.returnFarmPrinters();
  const statistics = await FilamentClean.getStatistics();
  const spools = await FilamentClean.getSpools();
  const profiles = await FilamentClean.getProfiles();

  res.render("filament", {
    name: req.user.name,
    userGroup: req.user.group,
    version,
    printerCount: printers.length,
    page: "Filament Manager",
    octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
    helpers: prettyHelpers,
    filamentManagerEnabled: req.serverSettingsCache.filamentManager,
    spools,
    profiles,
    statistics,
    historyStats
  });
});

// TODO race condition
softwareUpdateChecker.syncLatestOctoFarmRelease(false).then(() => {
  softwareUpdateChecker.checkReleaseAndLogUpdate();
});

// Hacky database check due to shoddy layout of code...
const mongoose = require("mongoose");

let interval = false;
if (interval === false) {
  interval = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      const printersInformation = PrinterClean.listPrintersInformation();
      await PrinterClean.sortCurrentOperations(printersInformation);
      await PrinterClean.statisticsStart();
      await PrinterClean.createPrinterList(
        printersInformation,
        getServerSettingsCache().octoPrintFilamentManagerPluginSettings
      );
    }
  }, 2500);
}

initHistoryCache().catch((e) => {
  console.error("X HistoryCache failed to initiate. " + e);
});

module.exports = router;
