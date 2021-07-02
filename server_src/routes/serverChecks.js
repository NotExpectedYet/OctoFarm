const express = require("express");

const router = express.Router();
const softwareUpdateChecker = require("../runners/softwareUpdateChecker");
const isDocker = require("is-docker");
const { isPm2, isNodemon, isNode } = require("../utils/env.utils");

router.get("/amialive", async (req, res) => {
  let softwareUpdateNotification =
    softwareUpdateChecker.getUpdateNotificationIfAny();

  // ensure update_vailable can only be true when Administrator group found
  if (req?.user?.group !== "Administrator") {
    softwareUpdateNotification.update_available = false;
  }

  res.json({
    ok: true,
    isDockerContainer: isDocker(),
    isNodemon: isNodemon(),
    isNode: isNode(),
    isPm2: isPm2(),
    os: process.env.OS,
    update: softwareUpdateNotification
  });
});

module.exports = router;
