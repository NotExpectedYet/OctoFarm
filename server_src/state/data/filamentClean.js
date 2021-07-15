"use strict";

const _ = require("lodash");
const Logger = require("../../handlers/logger.js");
const Spools = require("../../models/Filament.js");
const Profiles = require("../../models/Profiles.js");
const { PrinterClean } = require("./printerClean.js");

const logger = new Logger("OctoFarm-InformationCleaning");

let spoolsClean = [];
let profilesClean = [];
let statisticsClean = [];
let selectedFilamentList = [];
let dropDownList = {
  normalDropDown: [],
  historyDropDown: []
};

class FilamentClean {
  static noSpoolOptions = `<option value="0">No Spool Selected</option>`;

  static getSpools() {
    return spoolsClean;
  }

  static getProfiles() {
    return profilesClean;
  }

  static getStatistics() {
    return statisticsClean;
  }

  static getSelected() {
    return selectedFilamentList;
  }

  static getDropDown() {
    return dropDownList;
  }

  static async start(filamentManager) {
    const profiles = await Profiles.find({});
    const spools = await Spools.find({});
    const farmPrinters = await PrinterClean.listPrintersInformation();
    const spoolsArray = [];
    const profilesArray = [];

    for (let pr = 0; pr < profiles.length; pr++) {
      const profile = {
        _id: null,
        manufacturer: profiles[pr].profile.manufacturer,
        material: profiles[pr].profile.material,
        density: profiles[pr].profile.density,
        diameter: profiles[pr].profile.diameter
      };
      if (filamentManager) {
        profile._id = profiles[pr].profile.index;
      } else {
        profile._id = profiles[pr]._id;
      }
      profilesArray.push(profile);
    }
    for (let sp = 0; sp < spools.length; sp++) {
      const spool = {
        _id: spools[sp]._id,
        name: spools[sp].spools.name,
        profile: spools[sp].spools.profile,
        price: spools[sp].spools.price,
        weight: spools[sp].spools.weight,
        used: spools[sp].spools.used,
        remaining: spools[sp].spools.weight - spools[sp].spools.used,
        percent: 100 - (spools[sp].spools.used / spools[sp].spools.weight) * 100,
        tempOffset: spools[sp].spools.tempOffset,
        printerAssignment: await FilamentClean.getPrinterAssignment(spools[sp]._id, farmPrinters),
        fmID: spools[sp].spools.fmID
      };
      spoolsArray.push(spool);
    }
    spoolsClean = spoolsArray;
    profilesClean = profilesArray;

    selectedFilamentList = await FilamentClean.selectedFilament(farmPrinters);
    statisticsClean = await FilamentClean.createStatistics(
      spoolsArray,
      profilesArray,
      selectedFilamentList
    );
    await FilamentClean.dropDownList(spools, profiles, filamentManager, selectedFilamentList);
    logger.info("Filament information cleaned and ready for consumption...");
  }

  static dropDownList(spools, profiles, filamentManager, selected) {
    const normalDropObject = [this.noSpoolOptions];
    const historyDropObject = [this.noSpoolOptions];
    spools.forEach((spool) => {
      let profileId = null;
      if (filamentManager) {
        profileId = _.findIndex(profiles, function (o) {
          return o.profile.index == spool.spools.profile;
        });
      } else {
        profileId = _.findIndex(profiles, function (o) {
          return o._id == spool.spools.profile;
        });
      }
      const index = _.findIndex(selected, function (o) {
        return o == spool._id;
      });
      if (profileId >= 0) {
        if (filamentManager) {
          historyDropObject.push(`
                  <option value="${spool._id}">${spool.spools.name} (${(
            spool.spools.weight - spool.spools.used
          ).toFixed(2)}g) - ${profiles[profileId].profile.material}</option>
              `);
          if (index > -1) {
            normalDropObject.push(`
                  <option value="${spool._id}" disabled>${spool.spools.name} (${(
              spool.spools.weight - spool.spools.used
            ).toFixed(2)}g) - ${profiles[profileId].profile.material}</option>
              `);
          } else {
            normalDropObject.push(`
                  <option value="${spool._id}">${spool.spools.name} (${(
              spool.spools.weight - spool.spools.used
            ).toFixed(2)}g) - ${profiles[profileId].profile.material}</option>
              `);
          }
        } else {
          historyDropObject.push(`
                  <option value="${spool._id}">${spool.spools.name} - ${profiles[profileId].profile.material}</option>
              `);
          normalDropObject.push(`
                  <option value="${spool._id}">${spool.spools.name} - ${profiles[profileId].profile.material}</option>
              `);
        }
      }
    });
    dropDownList = {
      normalDropDown: normalDropObject,
      historyDropDown: historyDropObject
    };
  }

  static async selectedFilament(printers) {
    const selectedArray = [];
    for (let s = 0; s < printers.length; s++) {
      if (typeof printers[s] !== "undefined" && Array.isArray(printers[s].selectedFilament)) {
        for (let f = 0; f < printers[s].selectedFilament.length; f++) {
          if (printers[s].selectedFilament[f] !== null) {
            selectedArray.push(printers[s].selectedFilament[f]._id);
          }
        }
      }
    }
    return selectedArray;
  }

  static createStatistics(spools, profiles, selectedFilamentList) {
    const materials = [];
    let materialBreak = [];
    for (let p = 0; p < profiles.length; p++) {
      materials.push(profiles[p].material.replace(/ /g, "_"));
      const material = {
        name: profiles[p].material.replace(/ /g, "_"),
        weight: [],
        used: [],
        price: []
      };
      materialBreak.push(material);
    }
    materialBreak = _.uniqWith(materialBreak, _.isEqual);

    const used = [];
    const total = [];
    const price = [];
    for (let s = 0; s < spools.length; s++) {
      used.push(parseFloat(spools[s].used));
      total.push(parseFloat(spools[s].weight));
      price.push(parseFloat(spools[s].price));
      const profInd = _.findIndex(profiles, function (o) {
        return o._id == spools[s].profile;
      });
      if (profInd > -1) {
        const index = _.findIndex(materialBreak, function (o) {
          return o.name == profiles[profInd].material.replace(/ /g, "_");
        });

        materialBreak[index].weight.push(parseFloat(spools[s].weight));
        materialBreak[index].used.push(parseFloat(spools[s].used));
        materialBreak[index].price.push(parseFloat(spools[s].price));
      }
    }

    const materialBreakDown = [];
    for (let m = 0; m < materialBreak.length; m++) {
      const mat = {
        name: materialBreak[m].name,
        used: materialBreak[m].used.reduce((a, b) => a + b, 0),
        total: materialBreak[m].weight.reduce((a, b) => a + b, 0),
        price: materialBreak[m].price.reduce((a, b) => a + b, 0)
      };
      materialBreakDown.push(mat);
    }
    return {
      materialList: materials.filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      }),
      used: used.reduce((a, b) => a + b, 0),
      total: total.reduce((a, b) => a + b, 0),
      price: price.reduce((a, b) => a + b, 0),
      profileCount: profiles.length,
      spoolCount: spools.length,
      activeSpools: selectedFilamentList,
      activeSpoolCount: selectedFilamentList.length,
      materialBreakDown
    };
  }

  static getPrinterAssignment(spoolID, farmPrinters) {
    const assignments = [];
    for (let p = 0; p < farmPrinters.length; p++) {
      if (
        typeof farmPrinters[p] !== "undefined" &&
        Array.isArray(farmPrinters[p].selectedFilament)
      ) {
        for (let s = 0; s < farmPrinters[p].selectedFilament.length; s++) {
          if (farmPrinters[p].selectedFilament[s] !== null) {
            if (farmPrinters[p].selectedFilament[s]._id.toString() === spoolID.toString()) {
              const printer = {
                id: farmPrinters[p]._id,
                tool: s,
                name: farmPrinters[p].printerName
              };
              assignments.push(printer);
            }
          }
        }
      }
    }
    return assignments;
  }
}

module.exports = {
  FilamentClean
};
