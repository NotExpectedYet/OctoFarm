"use strict";

const printerModel = require("../models/Printer");

/**
 * Stores a new printer into the database.
 * @param {Object} printer object to create.
 * @throws {Error} If the printer is not correctly provided.
 */
const create = async (printer) => {
  if (!printer) throw new Error("Missing printer");

  return printerModel.create(printer);
};

/**
 * Lists the printers present in the database.
 */
const list = async () => {
  return printerModel.find({});
};

module.exports = {
  create,
  list
};
