const { createController } = require("awilix-express");
const { updateSorting, updateFilter } = require("../state/sorting.state.js");
const { ensureAuthenticated } = require("../middleware/auth");

class SortingFilteringController {
  updateFilter(req, res) {
    updateFilter(req.params.filter);
    res.sendStatus(200);
  }

  updateSorting(req, res) {
    updateSorting(req.params.sorting);
    res.sendStatus(200);
  }
}

// prettier-ignore
module.exports = createController(SortingFilteringController)
  .prefix("/client")
  .before([ensureAuthenticated])
  .get("/updateFilter/:filter", "updateFilter")
  .get("/updateSorting/:sorting", "updateSorting");

// const sortMe = function (printers) {
//   let sortBy = getSorting();
//   if (sortBy === "index") {
//     return printers;
//   } else if (sortBy === "percent") {
//     let sortedPrinters = printers.sort(function (a, b) {
//       if (typeof a.currentJob === "undefined") return 1;
//       if (typeof b.currentJob === "undefined") return -1;
//       return parseFloat(a.currentJob.percent) - parseFloat(b.currentJob.percent);
//     });
//     let i = 0,
//       len = sortedPrinters.length;
//     while (i + 1 < len + 1) {
//       sortedPrinters[i].order = i;
//       i++;
//     }
//     return sortedPrinters;
//   } else if (sortBy === "time") {
//     let sortedPrinters = printers.sort(function (a, b) {
//       if (typeof a.currentJob === "undefined") return 1;
//       if (typeof b.currentJob === "undefined") return -1;
//       return (
//         parseFloat(a.currentJob.printTimeRemaining) - parseFloat(b.currentJob.printTimeRemaining)
//       );
//     });
//     let i = 0,
//       len = sortedPrinters.length;
//     while (i + 1 < len + 1) {
//       sortedPrinters[i].order = i;
//       i++;
//     }
//     return sortedPrinters;
//   } else {
//     return printers;
//   }
// };
// const filterMe = function (printers) {
//   let filterBy = getFilter();
//   let currentGroups = []; // TODO Runner.returnGroupList();
//   if (filterBy === "All Printers") {
//     return printers;
//   } else if (filterBy === "State: Active") {
//     let i = 0,
//       len = printers.length;
//     while (i < len) {
//       printers[i].display = printers[i].printerState.colour.category === "Active";
//       i++;
//     }
//     return printers;
//   } else if (filterBy === "State: Idle") {
//     let i = 0,
//       len = printers.length;
//     while (i < len) {
//       printers[i].display = printers[i].printerState.colour.category === "Idle";
//       i++;
//     }
//     return printers;
//   } else if (filterBy === "State: Disconnected") {
//     let i = 0,
//       len = printers.length;
//     while (i < len) {
//       printers[i].display = printers[i].printerState.colour.category === "Disconnected";
//       i++;
//     }
//     return printers;
//   } else if (filterBy === "State: Complete") {
//     let i = 0,
//       len = printers.length;
//     while (i < len) {
//       printers[i].display = printers[i].printerState.colour.category === "Complete";
//       i++;
//     }
//     return printers;
//   } else {
//     //Check groups...
//     let current = null;
//     for (let i = 0; i < currentGroups.length; i++) {
//       if (filterBy === currentGroups[i]) {
//         current = currentGroups[i];
//       }
//     }
//     if (current !== null) {
//       let i = 0,
//         len = printers.length;
//       while (i < len) {
//         printers[i].display = printers[i].group === current.replace("Group: ", "");
//         i++;
//       }
//       return printers;
//     } else {
//       //Fall back...
//       return printers;
//     }
//   }
// };
