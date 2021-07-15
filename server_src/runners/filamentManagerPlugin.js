const filamentClean = require("../state/data/filamentClean.js");

const { FilamentClean } = filamentClean;

const Logger = require("../handlers/logger.js");

const logger = new Logger("OctoFarm-FilamentManager");

const Spool = require("../models/Filament.js");
const Profile = require("../models/Profiles.js");
const fetch = require("node-fetch");
class FilamentManagerPlugin {
  static async filamentManagerReSync(addSpool) {
    try {
      const { Runner } = require("../state/octofarm.manager.js");
      const printerList = Runner.returnFarmPrinters();
      let printer = null;
      for (let i = 0; i < printerList.length; i++) {
        if (
          printerList[i].stateColour.category === "Disconnected" ||
          printerList[i].stateColour.category === "Idle" ||
          printerList[i].stateColour.category === "Active" ||
          printerList[i].stateColour.category === "Complete"
        ) {
          printer = printerList[i];
          break;
        }
      }
      if (printer === null) {
        return "error";
      }
      const spools = await fetch(`${printer.printerURL}/plugin/filamentmanager/spools`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apikey
        }
      });
      const profiles = await fetch(`${printer.printerURL}/plugin/filamentmanager/profiles`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apikey
        }
      });

      // Make sure filament manager responds...
      if (spools.status != 200 || profiles.status != 200) {
        return {
          success: false,
          spools: spools.status,
          profiles: profiles.status
        };
      }

      const newSpools = [];
      const updatedSpools = [];
      const newProfiles = [];
      const updatedProfiles = [];

      const addSpools = [];
      const addProfiles = [];

      const spoolsFM = await spools.json();
      const profilesFM = await profiles.json();

      const S = "Spool";
      const P = "Profile";

      for (let s = 0; s < spoolsFM.spools.length; s++) {
        const sp = spoolsFM.spools[s];
        const spools = {
          name: sp.name,
          profile: sp.profile.id,
          price: sp.cost,
          weight: sp.weight,
          used: sp.used,
          tempOffset: sp.temp_offset,
          fmID: sp.id
        };
        const oldSpool = await Spool.findOne({ "spools.fmID": sp.id });
        if (oldSpool !== null) {
          updatedSpools.push(S);
          logger.info("Updating Spool: ", spools);
          oldSpool.spools = spools;
          oldSpool.markModified("spools");
          oldSpool.save();
        } else {
          // New Spool
          logger.info("Saving New Spool: ", spools);
          const newSpool = await new Spool({ spools });
          await newSpool.save();
          if (addSpool) {
            addSpools.push(newSpool);
          } else {
            newSpools.push(S);
          }
        }
      }

      for (let p = 0; p < profilesFM.profiles.length; p++) {
        const pr = profilesFM.profiles[p];
        const profile = {
          index: pr.id,
          density: pr.density,
          diameter: pr.diameter,
          manufacturer: pr.vendor,
          material: pr.material
        };
        const oldProfile = await Profile.findOne({ "profile.index": pr.id });
        if (oldProfile !== null) {
          updatedProfiles.push(P);
          logger.info("Updating Profile: ", profile);
          oldProfile.profile = profile;
          oldProfile.markModified("profile");
          oldProfile.save();
        } else {
          // New Profile
          logger.info("Saving New Profile: ", profile);
          const newProfile = await new Profile({ profile });
          await newProfile.save();
          if (addSpool) {
            addProfiles.push(newProfile);
          } else {
            newProfiles.push(P);
          }
        }
      }
      FilamentClean.start(true);
      logger.info("Successfully synced filament manager with octofarm.");
      if (addSpool) {
        return {
          success: true,
          newProfiles: addProfiles[0],
          newSpools: addSpools[0]
        };
      } else {
        return {
          success: true,
          newSpools: newSpools.length,
          updatedSpools: updatedSpools.length,
          newProfiles: newProfiles.length,
          updatedProfiles: updatedProfiles.length
        };
      }
    } catch (e) {
      console.error("SYNC", e);
    }
  }
}

module.exports = {
  FilamentManagerPlugin
};
