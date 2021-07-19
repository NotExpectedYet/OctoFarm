const PrinterGroupModel = require("../models/PrinterGroup");
const _ = require("lodash");

class PrinterGroupService {
  #printerService;

  constructor({ printerService }) {
    this.#printerService = printerService;
  }

  /**
   * Stores a new printer group into the database.
   * @param {Object} printerGroup object to create.
   * @throws {Error} If the printer group is not correctly provided.
   */
  async create(printerGroup) {
    if (!printerGroup) throw new Error("Missing printer-group");

    return PrinterGroupModel.create(printerGroup);
  }

  /**
   * Updates the printerGroup present in the database.
   * @param {Object} printerGroup object to create.
   */
  async update(printerGroup) {
    return PrinterGroupModel.update(printerGroup);
  }

  /**
   * Lists the printer groups present in the database.
   */
  async list() {
    return PrinterGroupModel.find({});
  }

  /**
   * Synchronize the old 'group' prop of each printer to become full-fledged PrinterGroup docs
   */
  async syncPrinterGroups() {
    const existingGroups = await this.list();
    const printers = await this.#printerService.list();
    const printersGrouped = _.groupBy(printers, "group");

    // Early quit
    if (!printers || printers.length === 0) return [];

    // Detect groups which are not yet made
    for (const [groupName, printers] of Object.entries(printersGrouped)) {
      // Skip any printer with falsy group property
      if (typeof groupName !== "string" || !groupName) continue;

      // Check if group already exists by this name
      const printerIds = printers.map((p) => p._id);
      const matchingGroup = existingGroups.find((g) => g.name === groupName);
      if (!!matchingGroup) {
        matchingGroup.printers = printerIds;
        await PrinterGroupModel.update(matchingGroup);
      } else {
        await PrinterGroupModel.create({
          name: groupName,
          printers: printerIds
        });
      }
    }

    return PrinterGroupModel.find({});
  }
}

module.exports = PrinterGroupService;
