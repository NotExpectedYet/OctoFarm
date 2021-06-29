const express = require("express");
const router = express.Router();
const {
  authenticateAccessToken
} = require("../middleware/local-client.strategy");
const { handleInputValidation } = require("../utils/input-validation.util");
const OctoprintRegistrationService = require("../services/octoprint-announcements.service");

const checkInputRules = {
  persistenceUuid: "required",
  deviceUuid: "required",
  host: "string",
  port: "required|numeric",
  docker: "required|boolean",
  allowCrossOrigin: "required|boolean"
};
router.post("/announce", authenticateAccessToken, async (req, res) => {
  let validInput = await handleInputValidation(req, checkInputRules, res);
  if (!validInput) return;
  else validInput.secured = req.secure;

  let deviceHost = validInput.host;
  if (!deviceHost) {
    deviceHost = req.socket.remoteAddress;
  }
  const prefix = req.secure ? "https" : "http";
  const deviceUrl = `${prefix}://${deviceHost}:${validInput.port}`;

  // Check registration existence
  let foundRegistration =
    await OctoprintRegistrationService.findAnnouncedDevice(
      validInput.deviceUuid,
      validInput.persistenceUuid
    );

  if (!foundRegistration) {
    foundRegistration = await OctoprintRegistrationService.create({
      isRegistered: false,
      deviceUuid: validInput.deviceUuid,
      persistenceUuid: validInput.persistenceUuid,
      host: deviceHost,
      port: validInput.port,
      secured: req.secure,
      docker: validInput.docker,
      allowCrossOrigin: validInput.allowCrossOrigin
    });
  } else {
    foundRegistration = await OctoprintRegistrationService.updateMetaData(
      foundRegistration._id,
      validInput
    );
  }

  res.send({
    alive: true,
    dateAdded: foundRegistration.dateAdded,
    deviceUrl: deviceUrl
  });
});

module.exports = router;
