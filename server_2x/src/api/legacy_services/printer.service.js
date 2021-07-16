'use strict';

const printerModel = require('../../api/models/Printer');

/**
 * Stores a new printer into the database.
 * @param {Object} printer object to create.
 * @throws {Error} If the printer is not correctly provided.
 */
module.exports.create = async (printer) => {
  if (!printer)
    throw new Error('Missing printer');

  return printerModel.create(printer);
};

/**
 * Lists the printers present in the database.
 */
module.exports.list = async () => {
  return await printerModel.find({});
};
