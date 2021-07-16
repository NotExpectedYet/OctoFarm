"use strict";

const printerGroupModel = require("../../api/models/PrinterGroup");
const printerService = require("../services/printer.service");
const _ = require("lodash");
const PrinterGroup = require("../../api/models/PrinterGroup");

/**
 * Stores a new printer group into the database.
 * @param {Object} printerGroup object to create.
 * @throws {Error} If the printer group is not correctly provided.
 */
async function create(printerGroup) {
  if (!printerGroup) throw new Error("Missing printer-group");

  return printerGroupModel.create(printerGroup);
}

/**
 * Updates the printerGroup present in the database.
 * @param {Object} printerGroup object to create.
 */
async function update(printerGroup) {
  return await printerGroupModel.update(printerGroup);
}

/**
 * Lists the printer groups present in the database.
 */
async function list() {
  return await printerGroupModel.find({});
}

/**
 * Synchronize the old 'group' prop of each printer to become full-fledged PrinterGroup docs
 */
async function syncPrinterGroups() {
  const existingGroups = await list();
  const printers = await printerService.list();
  const printersGrouped = _.groupBy(printers, "group");

  // Early quit
  if (!printers || printers.length === 0) return [];

  // Detect groups which are not yet made
  for (const [groupName, printers] of Object.entries(printersGrouped)) {
    // Skip any printer with falsy group property
    if (typeof groupName !== "string" || groupName === undefined) continue;

    // Check if group already exists by this name
    const printerIds = printers.map((p) => p._id);
    const matchingGroup = existingGroups.find((g) => g.name === groupName);
    if (!!matchingGroup) {
      matchingGroup.printers = printerIds;
      await update(matchingGroup);
    } else {
      await create({
        name: groupName,
        printers: printerIds
      });
    }
  }

  return await printerGroupModel.find({});
}

module.exports = {
  create,
  update,
  list,
  syncPrinterGroups
};
