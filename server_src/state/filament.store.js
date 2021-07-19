class FilamentStore {
  async updateFilament() {
    for (let i = 0; i < farmPrinters.length; i++) {
      const printer = this.getPrinter(index);
      if (Array.isArray(printer.selectedFilament)) {
        for (let f = 0; f < printer.selectedFilament.length; f++) {
          if (printer.selectedFilament[f] !== null) {
            const newInfo = await Filament.findById(printer.selectedFilament[f]._id);
            const printer = await Printers.findById(printer._id);
            printer.selectedFilament[f] = newInfo;
            printer.selectedFilament[f] = newInfo;
            printer.save();
            const currentFilament = await Runner.compileSelectedFilament(
              printer.selectedFilament,
              i
            );
            FileClean.generate(printer, currentFilament);
          }
        }
      } else if (printer.selectedFilament != null) {
        const newInfo = await Filament.findById(printer.selectedFilament._id);
        const printer = await Printers.findById(printer._id);
        printer.selectedFilament = newInfo;
        printer.selectedFilament = newInfo;
        printer.save();
        const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
        FileClean.generate(printer, currentFilament);
      }
    }
  }

  async selectedFilament(printerId, filamentId, tool) {
    const fprinter = this.getPrinter(index);
    const printer = await Printers.findById(printerId);
    // Check if filament already attached...
    // New selectedFilament array, so not array... none selected setup new.

    if (filamentId == 0) {
      printer.selectedFilament[tool] = null;
      fprinter.selectedFilament[tool] = null;
      // Find in selected filament list and remove
      const selected = _.findIndex(fprinter.selectedFilament, function (o) {
        return o == filamentId;
      });
    } else if (!Array.isArray(fprinter.selectedFilament)) {
      // Setup new spool...
      // Make sure selectedFilament is an array
      fprinter.selectedFilament = [];
      printer.selectedFilament = [];
      // Find the spool in the database...
      const spool = await Filament.findById(filamentId);
      // Save the spool to correct tool slot in filament array
      printer.selectedFilament[tool] = spool;
      fprinter.selectedFilament[tool] = spool;
    } else {
      // Already and array... check if spool already selected
      const spool = await Filament.findById(filamentId);
      printer.selectedFilament[tool] = spool;
      fprinter.selectedFilament[tool] = spool;
    }
    printer.markModified("selectedFilament");
    printer.save().then(async () => {
      const currentFilament = await Runner.compileSelectedFilament(fprinter.selectedFilament, i);
      FileClean.generate(fprinter, currentFilament);
    });
  }

  async compileSelectedFilament(selectedFilament, i) {
    const currentFilament = JSON.parse(JSON.stringify(selectedFilament));
    for (let s = 0; s < selectedFilament.length; s++) {
      if (selectedFilament[s] !== null) {
        let profile = null;
        try {
          if (serverSettings.filamentManager) {
            profile = await Profiles.findOne({
              "profile.index": selectedFilament[s].spools.profile
            });
          } else {
            profile = await Profiles.findById(selectedFilament[s].spools.profile);
          }
          currentFilament[s].spools.profile = profile.profile;
          farmPrinters[i].selectedFilament[s].spools.material = profile.profile.material;
        } catch (e) {
          logger.error("Couldn't find profile", e);
        }
      }
    }
    return currentFilament;
  }
}

module.exports = FilamentStore;
