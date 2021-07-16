const express = require("express");
const { ensureAuthenticated } = require("../config/auth");
const router = express.Router();
const printerGroupService = require("../services/printer-group.service");
router.get("/list", ensureAuthenticated, async (req, res) => {
  const groups = await printerGroupService.syncPrinterGroups();
  res.json(groups);
});

module.exports = router;
