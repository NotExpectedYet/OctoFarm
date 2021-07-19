class FilesStore {
  async getFile(id, fullPath) {
    const printer = this.getPrinter(id);
    const getFileInformation = await this.octoPrintService.getFile(printer, fullPath);
    const getJson = await getFileInformation.json();

    let timeStat = null;
    let filament = [];
    const entry = getJson;
    if (typeof entry.gcodeAnalysis !== "undefined") {
      if (typeof entry.gcodeAnalysis.estimatedPrintTime !== "undefined") {
        timeStat = entry.gcodeAnalysis.estimatedPrintTime;
        // Start collecting multiple tool lengths and information from files....
        Object.keys(entry.gcodeAnalysis.filament).forEach(function (item, i) {
          filament[i] = entry.gcodeAnalysis.filament[item].length;
        });
      } else {
        timeStat = "No Time Estimate";
        filament = null;
      }
    } else {
      timeStat = "No Time Estimate";
      filament = null;
    }
    let path = null;
    if (entry.path.indexOf("/") > -1) {
      path = entry.path.substr(0, entry.path.lastIndexOf("/"));
    } else {
      path = "local";
    }
    let thumbnail = null;

    if (typeof entry.thumbnail !== "undefined") {
      thumbnail = entry.thumbnail;
    }

    let success = 0;
    let failed = 0;
    let last = null;

    if (typeof entry.prints !== "undefined") {
      success = entry.prints.success;
      failed = entry.prints.failure;
      last = entry.prints.last.success;
    }

    return {
      path,
      fullPath: entry.path,
      display: entry.display,
      length: filament,
      name: entry.name,
      size: entry.size,
      time: timeStat,
      date: entry.date,
      thumbnail,
      success: success,
      failed: failed,
      last: last
    };
  }

  async getFiles(id, recursive) {
    const printer = this.getPrinter(id);
    printer.systemChecks.scanning.files.status = "warning";
    // Shim to fix undefined on upload files/folders
    printer.fileList = {
      files: [],
      fileCount: 0,
      folders: [],
      folderCount: 0
    };
    PrinterTicker.addIssue(printer, "Grabbing file information...", "Active");

    return await this.octoPrintService
      .getFiles(printer, recursive)
      .then((res) => {
        return res.json();
      })
      .then(async (res) => {
        // Setup the files json storage object
        printer.storage = {
          free: res.free,
          total: res.total
        };
        printer.markModified("storage");
        // Setup the files location object to place files...
        const printerFiles = [];
        const printerLocations = [];
        const recursivelyPrintNames = async function (entry, depth) {
          // eslint-disable-next-line no-param-reassign
          depth = depth || 0;
          let timeStat = "";
          let filament = [];
          const isFolder = entry.type === "folder";
          if (!isFolder) {
            if (typeof entry.gcodeAnalysis !== "undefined") {
              if (typeof entry.gcodeAnalysis.estimatedPrintTime !== "undefined") {
                timeStat = entry.gcodeAnalysis.estimatedPrintTime;
                // Start collecting multiple tool lengths and information from files....
                Object.keys(entry.gcodeAnalysis.filament).forEach(function (item, i) {
                  filament[i] = entry.gcodeAnalysis.filament[item].length;
                });
              } else {
                timeStat = "No Time Estimate";
                filament = null;
              }
            } else {
              timeStat = "No Time Estimate";
              filament = null;
            }

            let path = null;
            if (entry.path.indexOf("/") > -1) {
              path = entry.path.substr(0, entry.path.lastIndexOf("/"));
            } else {
              path = "local";
            }
            let thumbnail = null;

            if (typeof entry.thumbnail !== "undefined") {
              thumbnail = entry.thumbnail;
            }

            let success = 0;
            let failed = 0;
            let last = null;

            if (typeof entry.prints !== "undefined") {
              success = entry.prints.success;
              failed = entry.prints.failure;
              last = entry.prints.last.success;
            }

            const file = {
              path,
              fullPath: entry.path,
              display: entry.display,
              length: filament,
              name: entry.name,
              size: entry.size,
              time: timeStat,
              date: entry.date,
              thumbnail,
              success: success,
              failed: failed,
              last: last
            };
            printerFiles.push(file);
          }

          const folderPaths = {
            name: "",
            path: ""
          };
          if (isFolder) {
            if (entry.path.indexOf("/") > -1) {
              folderPaths.path = entry.path.substr(0, entry.path.lastIndexOf("/"));
            } else {
              folderPaths.path = "local";
            }

            if (entry.path.indexOf("/")) {
              folderPaths.name = entry.path;
            } else {
              folderPaths.name = entry.path.substr(0, entry.path.lastIndexOf("/"));
            }
            folderPaths.display = folderPaths.name.replace("/_/g", " ");
            printerLocations.push(folderPaths);
          }

          if (isFolder) {
            _.each(entry.children, function (child) {
              recursivelyPrintNames(child, depth + 1);
            });
          }
        };

        _.each(res.files, function (entry) {
          recursivelyPrintNames(entry);
        });
        printer.fileList = {
          files: printerFiles,
          fileCount: printerFiles.length,
          folders: printerLocations,
          folderCount: printerLocations.length
        };
        printer.markModified("fileList");
        const currentFilament = await Runner.compileSelectedFilament(
          printer.selectedFilament,
          index
        );
        FileClean.generate(printer, currentFilament);
        printer.systemChecks.scanning.files.status = "success";
        printer.systemChecks.scanning.files.date = new Date();
        PrinterTicker.addIssue(printer, "Grabbed file information...", "Complete");
        FileClean.statistics(farmPrinters);
        logger.info(`Successfully grabbed Files for...: ${printer.printerURL}`);
        return true;
      })
      .catch((err) => {
        printer.systemChecks.scanning.files.status = "danger";
        printer.systemChecks.scanning.files.date = new Date();
        PrinterTicker.addIssue(printer, `Error grabbing file information: ${err}`, "Disconnected");
        logger.error(`Error grabbing files for: ${printer.printerURL}: Reason: `, err);
        return false;
      });
  }

  async moveFile(id, newPath, fullPath, filename) {
    const printer = this.getPrinter(id);
    const file = _.findIndex(printer.fileList.files, function (o) {
      return o.name === filename;
    });
    printer.fileList.files[file].path = newPath;
    printer.fileList.files[file].fullPath = fullPath;
    printer.markModified("fileList");
    printer.save();
    const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
    FileClean.generate(printer, currentFilament);
    FileClean.statistics(farmPrinters);
  }

  async moveFolder(id, oldFolder, fullPath, folderName) {
    const printer = this.getPrinter(id);
    const file = _.findIndex(printer.fileList.folders, function (o) {
      return o.name === oldFolder;
    });
    printer.fileList.files.forEach((file, index) => {
      if (file.path === oldFolder) {
        const fileName = printer.fileList.files[index].fullPath.substring(
          printer.fileList.files[index].fullPath.lastIndexOf("/") + 1
        );
        printer.fileList.files[index].fullPath = `${folderName}/${fileName}`;
        printer.fileList.files[index].path = folderName;
      }
    });
    printer.fileList.folders[file].name = folderName;
    printer.fileList.folders[file].path = fullPath;
    printer.markModified("fileList");
    printer.save();
    const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
    FileClean.generate(printer, currentFilament);
    FileClean.statistics(farmPrinters);
  }

  async deleteFolder(id, fullPath) {
    const printer = this.getPrinter(id);
    printer.fileList.files.forEach((file, index) => {
      if (file.path === fullPath) {
        printer.fileList.files.splice(index, 1);
      }
    });
    printer.fileList.folders.forEach((folder, index) => {
      if (folder.path === fullPath) {
        printer.fileList.folders.splice(index, 1);
      }
    });
    const folder = _.findIndex(printer.fileList.folders, function (o) {
      return o.name === fullPath;
    });
    printer.fileList.folders.splice(folder, 1);
    printer.fileList.fileCount = printer.fileList.files.length;
    printer.fileList.folderCount = printer.fileList.folders.length;
    printer.markModified("fileList");
    printer.save();
    const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
    FileClean.generate(printer, currentFilament);
    FileClean.statistics(farmPrinters);
  }

  async newFolder(folder) {
    const index = folder.i;
    const printer = this.getPrinter(index);
    let path = "local";
    let name = folder.foldername;
    if (folder.path !== "") {
      path = folder.path;
      name = `${path}/${name}`;
    }
    const display = JSON.parse(JSON.stringify(name));
    name = name.replace(/ /g, "_");
    const newFolder = {
      name,
      path,
      display
    };

    printer.fileList.folders.push(newFolder);
    printer.fileList.folderCount = printer.fileList.folders.length;
    printer.markModified("fileList");
    printer.save();
    const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
    FileClean.generate(printer, currentFilament);
    FileClean.statistics(farmPrinters);
  }

  async newFile(file) {
    const date = new Date();

    file = file.files.local;

    let path = "";
    if (file.path.indexOf("/") > -1) {
      path = file.path.substr(0, file.path.lastIndexOf("/"));
    } else {
      path = "local";
    }
    const fileDisplay = file.name.replace(/_/g, " ");
    const data = {
      path: path,
      fullPath: file.path,
      display: fileDisplay,
      length: null,
      name: file.name,
      size: null,
      time: null,
      date: date.getTime() / 1000,
      thumbnail: null,
      success: 0,
      failed: 0,
      last: null
    };

    const printer = this.getPrinter(file.index);
    printer.fileList.files.push(data);
    printer.markModified("fileList");
    printer.save();

    const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
    FileClean.generate(printer, currentFilament);
    FileClean.statistics(farmPrinters);
    await this.updateFile(printer.fileList.files[printer.fileList.files.length - 1], i);
  }

  async reSyncFile(id, fullPath) {
    const printer = this.getPrinter(id);
    const fileID = _.findIndex(printer.fileList.files, function (o) {
      return o.fullPath == fullPath;
    });
    // Doesn't actually resync just the file... shhh
    printer.fileList.files[fileID] = await Runner.getFile(id, fullPath);
    printer.markModified("fileList");
    printer.save();
    const currentFilament = await Runner.compileSelectedFilament(printer.selectedFilament, i);
    FileClean.generate(printer, currentFilament);
    FileClean.statistics(farmPrinters);

    return true;
  }

  async removeFile(printer, fullPath) {
    const fprinter = this.getPrinter(printer._id);

    const index = await _.findIndex(fprinter.fileList.files, function (o) {
      return o.fullPath === fullPath;
    });
    fprinter.fileList.files.splice(index, 1);
    fprinter.fileList.fileCount = fprinter.fileList.files.length;
    fprinter.markModified("fileList");
    fprinter.save();
    const currentFilament = await Runner.compileSelectedFilament(fprinter.selectedFilament, i);
    FileClean.generate(fprinter, currentFilament);
    FileClean.statistics(farmPrinters);
  }

  async updateFile(file, i) {
    const printer = farmPrinters[i];
    if (fileTimeout <= 20000) {
      logger.info(
        `Updating new file ${
          printer.fileList.files[printer.fileList.files.length - 1].name
        } for Printer:${printer.printerURL}`
      );
      // TODO NO!
      // setTimeout(async function () {
      //   let path = file.fullPath;
      //   if (path.includes("local")) {
      //     path = JSON.parse(JSON.stringify(file.fullPath.replace("local", "")));
      //   }
      //   const fileInformation = await Runner.getFile(printer._id, path);
      //   fileTimeout += 5000;
      //   if (fileInformation) {
      //     logger.info("New File Information:", fileInformation);
      //     printer.fileList.files[printer.fileList.files.length - 1] = fileInformation;
      //     printer.markModified("fileList");
      //     printer.save();
      //     if (fileInformation.time === null || fileInformation.time === "No Time Estimate") {
      //       logger.info("File Information Still Missing Retrying...");
      //       Runner.updateFile(printer.fileList.files[printer.fileList.files.length - 1], i);
      //       const currentFilament = await Runner.compileSelectedFilament(
      //         printer.selectedFilament,
      //         i
      //       );
      //       FileClean.generate(printer, currentFilament);
      //       FileClean.statistics(farmPrinters);
      //       return null;
      //     } else {
      //       const currentFilament = await Runner.compileSelectedFilament(
      //         printer.selectedFilament,
      //         i
      //       );
      //       FileClean.generate(printer, currentFilament);
      //       FileClean.statistics(farmPrinters);
      //       return null;
      //     }
      //   }
      // }, 5000);
    } else {
      logger.info("File information took too long to generate, awaiting manual scan...");
    }
  }
}

module.exports = FilesStore;
