const express = require("express");
const router = express.Router();
const OctoprintRegistrationService = require("../services/octoprint-announcements.service");
const { handleInputValidation } = require("../utils/input-validation.util");
const { Runner } = require("../../../runners/state");
const { ensureAuthenticated } = require("../../../config/auth");

const listAnnouncementValidationRules = {
  onlyNotRegistered: "required|boolean"
};
/**
 * List all the announced printers
 * {isRegistered} Filter on non-registered printers or return all printers
 */
router.get("/list-announcements", ensureAuthenticated, async (req, res) => {
  // First validate input
  const validInput = await handleInputValidation(
    req,
    listAnnouncementValidationRules,
    res
  );
  if (!validInput) return;

  const registrations = await OctoprintRegistrationService.list(
    validInput.onlyNotRegistered
  );

  res.send({
    registrations
  });
});

const registrationValidationRules = {
  persistenceUuid: "required",
  deviceUuid: "required",
  deviceUrl: "required",
  deviceApplicationKey: "required"
};
/**
 * Convert an announced instance to a printer, requiring the 'deviceUrl' and 'deviceApplicationKey' to perform registration as normal.
 */
router.post("/register", ensureAuthenticated, async (req, res) => {
  // First validate input
  const validInput = await handleInputValidation(
    req,
    registrationValidationRules,
    res
  );
  if (!validInput) return;

  // Check the announced device
  const announcedDevice =
    await OctoprintRegistrationService.findAnnouncedDevice(
      validInput.deviceUuid,
      validInput.persistenceUuid
    );
  if (!announcedDevice) {
    res.status(404);
    return res.send({
      error:
        "Device announcement not found with the provided 'deviceUuid' and 'persistenceUuid' and 'isRegistered':false"
    });
  }

  // (Query the device)
  // Do it...

  // Construct the printer device
  const deviceInput = {
    dateAdded: Date.now(),
    printerURL: validInput.deviceUrl,
    apikey: validInput.deviceApplicationKey,
    settingsAppearance: {} // yuck
  };

  // Add printer
  // TODO We can do a less impactful call (we dont want immediate websocket, just a registration)
  const newPrinter = await Runner.addPrinters([deviceInput]);

  // Wrap up the registration
  await OctoprintRegistrationService.updateSetRegistered(announcedDevice._id);

  res.send({
    newPrinter
    // socket: req.socket.localAddress,
    // localPort: req.socket.localPort,
    // remotePort: req.socket.remotePort,
    // remoteAddress: req.socket.remoteAddress,
    // remoteFamily: req.socket.remoteFamily,
    // addr: req.socket.remoteAddress
  });
});

module.exports = router;
