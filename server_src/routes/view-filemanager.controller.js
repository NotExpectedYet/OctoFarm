const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const prettyHelpers = require("../../views/partials/functions/pretty.js");
const { FileClean } = require("../state/data/fileClean");

const viewFileManager = ({ serverVersion, printersStore, octoFarmPageTitle }) => ({
  index: async (req, res) => {
    const printers = printersStore.getPrinters();

    // const currentOperations = PrinterClean.returnCurrentOperations();
    // const fileStatistics = FileClean.returnStatistics();

    res.render("filemanager", {
      name: req.user.name,
      userGroup: req.user.group,
      version: serverVersion,
      page: "Printer Manager",
      octoFarmPageTitle,
      printerCount: printers.length,
      helpers: prettyHelpers,
      currentOperationsCount: currentOperations.count,
      fileStatistics
    });
  }
});

// prettier-ignore
module.exports = createController(viewFileManager)
  .prefix("/filemanager")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("", "index");
