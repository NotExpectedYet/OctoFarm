"use strict";

const OctoPrintAnnouncement = require("../models/OctoprintAnnouncement");

const findAnnouncedDevice = async (deviceUuid, persistenceUuid) => {
  if (!deviceUuid || !persistenceUuid) {
    return false;
  }

  return OctoPrintAnnouncement.findOne({
    deviceUuid,
    persistenceUuid
  });
};

/**
 * List either all announced registrations, or only the instances which have not been converted to OctoFarm printer.
 * @param onlyNotRegistered (default: true)
 * @returns {Promise<Query<Array<EnforceDocument<unknown, {}>>, Document<any, any>, {}>>}
 */
const list = async (onlyNotRegistered = true) => {
  if (onlyNotRegistered) {
    return OctoPrintAnnouncement.find({
      isRegistered: false
    });
  } else {
    return OctoPrintAnnouncement.find({});
  }
};

const updateSetRegistered = async (id) => {
  const unregisteredDevice = await OctoPrintAnnouncement.findOne({
    _id: id,
    isRegistered: false
  });
  if (!unregisteredDevice) return;

  unregisteredDevice.dateRegistered = Date.now();
  unregisteredDevice.isRegistered = true;
  await unregisteredDevice.save();

  return unregisteredDevice;
};

const updateMetaData = async (id, input) => {
  let device = await OctoPrintAnnouncement.findOne({
    _id: id
  });
  if (!device) return;

  device.host = input.host;
  device.port = input.port;
  device.secured = input.secured;
  device.docker = input.docker;
  device.allowCrossOrigin = input.allowCrossOrigin;

  return await device.save();
};
/**
 * Add a dynamically created octoprint registration proposal
 * @param data
 * @returns {Promise<Document>}
 */
const create = async (data) => {
  const octoprintRegistrationEntry = new OctoPrintAnnouncement({
    isRegistered: data.isRegistered,
    dateRegistered: null,
    deviceUuid: data.deviceUuid,
    persistenceUuid: data.persistenceUuid,
    host: data.host,
    port: data.port,
    secured: data.secured,
    docker: data.docker,
    allowCrossOrigin: data.allowCrossOrigin
  });

  await octoprintRegistrationEntry.save();

  return octoprintRegistrationEntry;
};

module.exports = {
  findAnnouncedDevice,
  list,
  create,
  updateSetRegistered,
  updateMetaData
};
