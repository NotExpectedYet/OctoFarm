const _ = require("lodash");
const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth.js");
const { ensureCurrentUserAndGroup } = require("../config/users.js");
const ServerSettings = require("../models/ServerSettings.js");
const prettyHelpers = require("../../views/partials/functions/pretty.js");
const { Runner } = require("../runners/state.js");
const { FilamentClean } = require("../lib/dataFunctions/filamentClean.js");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean.js");
const { PrinterClean } = require("../lib/dataFunctions/printerClean.js");
const { FileClean } = require("../lib/dataFunctions/fileClean.js");
const { getSorting, getFilter } = require("../lib/sorting.js");
const { AppConstants } = require("../app.constants");
const {
  getDefaultDashboardSettings
} = require("../lib/providers/settings.constants");
const { getHistoryCache } = require("../cache/history.cache");
const softwareUpdateChecker = require("../services/octofarm-update.service");

const version = process.env[AppConstants.VERSION_KEY];

// Welcome Page
router.get("/", async (req, res) => {
  const serverSettings = await ServerSettings.find({});

  if (serverSettings[0].server.loginRequired === false) {
    res.redirect("/dashboard");
  } else {
    const { registration } = serverSettings[0].server;

    if (req.isAuthenticated()) {
      res.redirect("/dashboard");
    } else {
      res.render("welcome", {
        page: "Welcome",
        octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
        registration,
        serverSettings: serverSettings[0]
      });
    }
  }
});

// Dashboard Page
router.get(
  "/dashboard",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
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
  }
);
router.get(
  "/printers",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = await Runner.returnFarmPrinters();
    const serverSettings = await SettingsClean.returnSystemSettings();
    res.render("printerManagement", {
      name: req.user.name,
      userGroup: req.user.group,
      version,
      page: "Printer Manager",
      octoFarmPageTitle: process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY],
      printerCount: printers.length,
      helpers: prettyHelpers,
      air_gapped: softwareUpdateChecker.getUpdateNotificationIfAny().air_gapped
    });
  }
);
// File Manager Page
router.get(
  "/filemanager",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = await Runner.returnFarmPrinters();
    const serverSettings = await SettingsClean.returnSystemSettings();
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
  }
);
// History Page
router.get(
  "/history",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
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
  }
);

// Panel view  Page
router.get(
  "/mon/panel",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
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
  }
);
// Camera view  Page
router.get(
  "/mon/camera",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = await Runner.returnFarmPrinters();
    const sortedIndex = await Runner.sortedIndex();
    const clientSettings = await SettingsClean.returnClientSettings();
    const serverSettings = await SettingsClean.returnSystemSettings();
    const dashStatistics = await PrinterClean.returnDashboardStatistics();
    const currentSort = getSorting();
    const currentFilter = getFilter();

    let printGroups = await Runner.returnGroupList();
    if (typeof printGroups === "undefined") {
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
  }
);
router.get(
  "/mon/printerMap",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const printers = await Runner.returnFarmPrinters();
    const sortedIndex = await Runner.sortedIndex();
    const clientSettings = await SettingsClean.returnClientSettings();
    const serverSettings = await SettingsClean.returnSystemSettings();

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
  }
);
// List view  Page
router.get(
  "/mon/list",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
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
  }
);
router.get(
  "/mon/currentOp",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
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
  }
);
router.get(
  "/filament",
  ensureAuthenticated,
  ensureCurrentUserAndGroup,
  async (req, res) => {
    const historyCache = getHistoryCache();
    const historyStats = historyCache.generateStatistics();

    const printers = Runner.returnFarmPrinters();
    const serverSettings = await SettingsClean.returnSystemSettings();
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
      serverSettings,
      spools,
      profiles,
      statistics,
      historyStats
    });
  }
);

module.exports = router;
