const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const prettyHelpers = require("../../views/partials/functions/pretty.js");
const ServerSentEventsHandler = require("../handlers/sse.handler");
const { getFilter } = require("../state/sorting.state");
const { getSorting } = require("../state/sorting.state");

class ViewDashboard {
  #serverVersion;
  #settingsStore;
  #printersStore;
  #octoFarmPageTitle;

  #sseHandler = new ServerSentEventsHandler({});

  constructor({ settingsStore, printersStore, serverVersion, octoFarmPageTitle }) {
    this.#settingsStore = settingsStore;
    this.#serverVersion = serverVersion;
    this.#printersStore = printersStore;
    this.#octoFarmPageTitle = octoFarmPageTitle;
  }

  getCommonMetadata() {
    return {
      printGroups: this.#printersStore.getPrinterGroups(),
      currentChanges: { currentSort: getSorting(), currentFilter: getFilter() }
      // dashboardStatistics: PrinterClean.returnDashboardStatistics()
    };
  }

  camera(req, res) {
    this.handler(req, res, "cameraView", "Camera View", this.getCommonMetadata());
  }

  panel(req, res) {
    this.handler(req, res, "panelView", "Panel View", this.getCommonMetadata());
  }

  list(req, res) {
    this.handler(req, res, "listView", "List View", this.getCommonMetadata());
  }

  map(req, res) {
    const meta = {
      printGroups: this.#printersStore.getPrinterGroups(),
      currentChanges: { currentSort: getSorting(), currentFilter: getFilter() }
    };
    this.handler(req, res, "mapView", "Map View", meta);
  }

  currentOps(req, res) {
    this.handler(req, res, "currentOperationsView", "Current Operations", {});
  }

  handler(req, res, template, pageTitle, meta = {}) {
    const clientSettings = this.#settingsStore.getClientSettings();
    const printers = this.#printersStore.getPrinters();
    const sortedIndex = this.#printersStore.getPrinterSortingList();

    res.render(template, {
      name: req.user.name,
      userGroup: req.user.group,
      version: this.#serverVersion,
      octoFarmPageTitle: this.#octoFarmPageTitle,
      page: pageTitle,
      printers,
      printerCount: printers.length,
      helpers: prettyHelpers,
      sortedIndex,
      clientSettings,
      ...meta
    });
  }

  sse(req, res) {
    this.#sseHandler.handleRequest(req, res);
  }
}

// prettier-ignore
module.exports = createController(ViewDashboard)
  .prefix("/mon")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("/camera", "camera")
  .get("/panel", "panel")
  .get("/map", "map")
  .get("/list", "list")
  .get("/current-ops", "currentOps")
  .get("/sse", "sse");
