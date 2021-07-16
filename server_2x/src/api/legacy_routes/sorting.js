const express = require("express");

const router = express.Router();
const { ensureAuthenticated } = require("../../server/src/auth/config/auth");

const { updateSorting, updateFilter } = require("../../server/src/printers/lib/sorting.js");

router.get("/updateFilter/:filter", ensureAuthenticated, async (req, res) => {
  updateFilter(req.params.filter);
  res.sendStatus(200);
});
router.get("/updateSorting/:sorting", ensureAuthenticated, async (req, res) => {
  updateSorting(req.params.sorting);
  res.sendStatus(200);
});

module.exports = router;
