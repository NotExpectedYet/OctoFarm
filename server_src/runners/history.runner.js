const _ = require("lodash");
const fetch = require("node-fetch");
const fs = require("fs");
const History = require("../models/History.js");
const ErrorLog = require("../models/ErrorLog.js");
const Logger = require("../lib/logger.js");
const filamentProfiles = require("../models/Profiles.js");
const ServerSettings = require("../models/ServerSettings.js");
const Spool = require("../models/Filament.js");
const { FilamentManagerPlugin } = require("./filamentManagerPlugin.js");
const { ScriptRunner } = require("./scriptCheck.js");
const MjpegDecoder = require("mjpeg-decoder");
const {
  downloadImage,
  downloadFromOctoPrint
} = require("../utils/download.util");
const { getHistoryCache } = require("../cache/history.cache");
const { writePoints } = require("../lib/influxExport.js");

const logger = new Logger("OctoFarm-HistoryCollection");
let counter = 0;
let errorCounter = 0;

const routeBase = "./images/historyCollection";
const PATHS = {
  base: routeBase,
  thumbnails: routeBase + "/thumbs",
  snapshots: routeBase + "/snapshots",
  timelapses: routeBase + "/timelapses"
};

/**
 * Make a specific historyCollection folder if not created yet
 */
function ensureFolderExists(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
}

/**
 * Make the historyCollection root folder if not created yet
 */
function ensureBaseFolderExists() {
  ensureFolderExists(PATHS.base);
}

class HistoryCollection {
  static octoPrintService;

  /**
   * Without dependency injection this is what we've got
   * @param service
   * @returns {Promise<void>}
   */
  static async inject(service) {
    this.octoPrintService = service;
  }

  /**
   * Until we have V2 DI we must do it ourselves
   */
  static validateProviders() {
    if (!this.octoPrintService) {
      throw "OctoPrint Client Connector not instantiated. Report please.";
    }
  }

  static async resyncFilament(printer) {
    this.validateProviders();

    const returnSpools = [];
    try {
      for (let i = 0; i < printer.selectedFilament.length; i++) {
        if (printer.selectedFilament[i] !== null) {
          const filamentID = printer.selectedFilament[i].spools.fmID;
          if (!filamentID) {
            throw `Could not query OctoPrint FilamentManager for filament. FilamentID '${filamentID}' not found.`;
          }
          const response =
            await this.octoPrintService.getPluginFilamentManagerFilament(
              printer,
              filamentID
            );

          logger.info(
            `${printer.printerURL}: spools fetched. Status: ${response.status}`
          );
          const sp = await response.json();

          const spoolID = printer.selectedFilament[i]._id;
          const spoolEntity = await Spool.findById(spoolID);
          if (!spoolEntity) {
            throw `Spool database entity by ID '${spoolID}' not found. Cant update filament.`;
          }
          spoolEntity.spools = {
            name: sp.spool.name,
            profile: sp.spool.profile.id,
            price: sp.spool.cost,
            weight: sp.spool.weight,
            used: sp.spool.used,
            tempOffset: sp.spool.temp_offset,
            fmID: sp.spool.id
          };
          logger.info(
            `${printer.printerURL}: updating... spool status ${spoolEntity.spools}`
          );
          spoolEntity.markModified("spools");
          await spoolEntity.save();
          returnSpools.push(spoolEntity);
        }
      }
    } catch (e) {
      logger.info(
        e,
        `${printer.printerURL}: Issue contacting filament manager... not updating spool`
      );
    }

    // TODO dynamic circular import to State/Runner
    const reSync = await FilamentManagerPlugin.filamentManagerReSync();
    // Return success
    logger.info(reSync);
    return returnSpools;
  }

  static async grabThumbnail(url, thumbnail, id, printer) {
    const thumbParts = thumbnail.split("/");
    const result = thumbParts[thumbParts.length - 1];
    const splitAgain = result.split("?");
    const filePath = `${PATHS.thumbnails}/${id}-${splitAgain[0]}`;

    ensureBaseFolderExists();
    ensureFolderExists(PATHS.thumbnails);

    await downloadImage(url, filePath, printer.apikey, () => {
      logger.info("Downloaded: ", url);
      logger.info(filePath);
    });

    return filePath;
  }

  static async snapPictureOfPrinter(url, id, fileDisplay) {
    ensureBaseFolderExists();
    ensureFolderExists(PATHS.snapshots);

    const decoder = MjpegDecoder.decoderForSnapshot(url);
    const frame = await decoder.takeSnapshot();
    const filePath = `${PATHS.snapshots}/${id}-${fileDisplay}.jpg`;

    await fs.writeFileSync(filePath, frame);
    logger.info("Downloaded: ", url);
    logger.info("Saved as: ", filePath);
    return filePath;
  }

  /**
   * TODO speechless... this function...
   * @param payload
   * @param serverSettings
   * @param files
   * @param id
   * @param event
   * @param printer
   * @returns {Promise<null>}
   */
  static async thumbnailCheck(
    payload,
    serverSettings,
    files,
    id,
    event,
    printer
  ) {
    let runCapture = async () => {
      // grab Thumbnail if available.
      const currentFileIndex = _.findIndex(files, function (o) {
        return o.name === payload.name;
      });
      let base64Thumbnail = null;
      if (currentFileIndex > -1) {
        if (
          typeof files[currentFileIndex] !== "undefined" &&
          files[currentFileIndex].thumbnail != null
        ) {
          base64Thumbnail = await HistoryCollection.grabThumbnail(
            `${printer.printerURL}/${files[currentFileIndex].thumbnail}`,
            files[currentFileIndex].thumbnail,
            id,
            printer
          );
        }
      }
      return base64Thumbnail;
    };

    if (
      typeof serverSettings.history === "undefined" ||
      serverSettings.history.thumbnails[event]
    ) {
      return await runCapture();
    } else {
      return null;
    }
  }

  static async snapshotCheck(
    event,
    serverSettings,
    printer,
    saveHistory,
    payload
  ) {
    // Use default settings if not present
    if (
      typeof serverSettings.history === "undefined" ||
      serverSettings.history.snapshot[event]
    ) {
      return await HistoryCollection.snapPictureOfPrinter(
        printer.camURL,
        saveHistory._id,
        payload.name
      );
    } else {
      return null;
    }
  }

  static async timelapseCheck(
    printer,
    fileName,
    printTime,
    serverSettings,
    id
  ) {
    if (printTime >= 10) {
      let interval = false;
      const grabTimelapse = async (printer) => {
        return await fetch(
          `${printer.printerURL}/api/timelapse?unrendered=true`,
          {
            method: "GET",
            headers: {
              "Content-Type": "video/mp4",
              "X-Api-Key": printer.apikey
            }
          }
        );
      };
      logger.info("Checking for timelapse...", fileName);
      if (!interval) {
        interval = setInterval(async function () {
          let timelapse = await grabTimelapse(printer);
          if (timelapse.status === 200) {
            const timelapseResponse = await timelapse.json();
            logger.info(
              "Successfully grabbed timelapse list... Checking for:",
              fileName
            );
            let unrenderedFileName = null;
            if (timelapseResponse.unrendered.length === 0) {
              let cleanName = fileName;
              if (fileName.includes(".gcode")) {
                cleanName = fileName.replace(".gcode", "");
              }
              let lastTimelapse = null;
              if (unrenderedFileName === null) {
                lastTimelapse = _.findIndex(
                  timelapseResponse.files,
                  function (o) {
                    return o.name.includes(cleanName);
                  }
                );
              } else {
                lastTimelapse = _.findIndex(
                  timelapseResponse.files,
                  function (o) {
                    return o.name.includes(unrenderedFileName);
                  }
                );
              }

              if (
                lastTimelapse !== -1 &&
                !timelapseResponse.files[lastTimelapse].url.includes(".mpg")
              ) {
                let lapse = await HistoryCollection.grabTimeLapse(
                  timelapseResponse.files[lastTimelapse].name,
                  printer.printerURL +
                    timelapseResponse.files[lastTimelapse].url,
                  id,
                  printer,
                  serverSettings
                );
                //Clearing interval
                clearInterval(interval);
                const saveHistory = await History.findById(id);
                saveHistory.printHistory.timelapse = lapse;
                saveHistory.markModified("printHistory");
                await saveHistory.save();
                await getHistoryCache().initCache();
                logger.info("Successfully grabbed timelapse!");
              } else {
                const updateHistory = await History.findById(id);
                updateHistory.printHistory.timelapse = "";
                updateHistory.markModified("printHistory");
                await updateHistory.save();
                await getHistoryCache().initCache();
                logger.info("Successfully grabbed timelapse!");
                clearInterval(interval);
                return null;
              }
            } else {
              if (unrenderedFileName === null) {
                let unRenderedGrab = [...timelapseResponse.unrendered].filter(
                  function (lapse) {
                    let lapseName = lapse.name.replace(/\s/g, "_");
                    let checkName = fileName.replace(/\s/g, "_");
                    if (checkName.includes(".gcode")) {
                      checkName = fileName.replace(".gcode", "");
                    }
                    return lapseName.includes(checkName);
                  }
                );
                if (unRenderedGrab.length === 1) {
                  unrenderedFileName = unRenderedGrab[0].name;
                  logger.info(
                    "File is still rendering... awaiting completion:",
                    unrenderedFileName
                  );
                } else {
                  logger.info(
                    "No un-rendered files... must be complete, attempting download.",
                    unRenderedGrab
                  );
                }
              } else {
                logger.info(
                  `Awaiting ${unrenderedFileName} to finish rendering`
                );
              }
            }
          } else {
            return null;
          }
        }, 5000);
      }
    } else {
      return null;
    }
  }

  /**
   * Grabs the timelapse by downloading it from OctoPrint's API
   * @param fileName
   * @param url
   * @param id
   * @param printer
   * @param serverSettings
   * @returns {Promise<string>}
   */
  static async grabTimeLapse(fileName, url, id, printer, serverSettings) {
    ensureBaseFolderExists();
    ensureFolderExists(PATHS.timelapses);

    const filePath = `${PATHS.timelapses}/${id}-${fileName}`;

    await downloadFromOctoPrint(
      url,
      filePath,
      () => {
        logger.info("Downloaded: ", url);
        logger.info(filePath);
        if (serverSettings?.history?.timelapse?.deleteAfter) {
          HistoryCollection.deleteTimeLapse(printer, fileName);
        }
      },
      printer.apikey
    );

    return filePath;
  }

  static async deleteTimeLapse(printer, fileName) {
    const deleteTimeLapse = async (fileName) => {
      return await fetch(`${printer.printerURL}/api/timelapse/${fileName}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apikey
        }
      });
    };
    await deleteTimeLapse(fileName);
    logger.info("Successfully deleted " + fileName + " from OctoPrint.");
  }

  static async objectCleanforInflux(obj) {
    for (var propName in obj) {
      if (obj[propName] === null) {
        delete obj[propName];
      }
    }
  }

  static async updateInfluxDB(historyID, measurement, printer) {
    let historyArchive = getHistoryCache().historyClean;
    let currentArchive = _.findIndex(historyArchive, function (o) {
      return JSON.stringify(o._id) === JSON.stringify(historyID);
    });
    if (currentArchive > -1) {
      let workingHistory = historyArchive[currentArchive];
      let startDateSplit = workingHistory.startDate.split(" ");
      let endDateSplit = workingHistory.endDate.split(" ");
      const trueStartDate = Date.parse(
        `${startDateSplit[2]} ${startDateSplit[1]} ${startDateSplit[3]} ${startDateSplit[5]}`
      );
      const trueEndDate = Date.parse(
        `${endDateSplit[2]} ${endDateSplit[1]} ${endDateSplit[3]} ${endDateSplit[5]}`
      );
      let currentState = " ";
      if (workingHistory.state.includes("Success")) {
        currentState = "Success";
      } else if (workingHistory.state.includes("Cancelled")) {
        currentState = "Cancelled";
      } else if (workingHistory.state.includes("Failure")) {
        currentState = "Failure";
      }
      let group = " ";
      if (printer.group === "") {
        group = " ";
      } else {
        group = printer.group;
      }
      const tags = {
        printer_name: workingHistory.printer,
        group: group,
        url: printer.printerURL,
        history_state: currentState,
        file_name: workingHistory.file.name
      };
      let printerData = {
        id: String(workingHistory._id),
        index: parseInt(workingHistory.index),
        state: currentState,
        printer_name: workingHistory.printer,
        start_date: trueStartDate,
        end_date: trueEndDate,
        print_time: parseInt(workingHistory.printTime),
        file_name: workingHistory.file.name,
        file_upload_date: parseFloat(workingHistory.file.uploadDate),
        file_path: workingHistory.file.path,
        file_size: parseInt(workingHistory.file.size),

        notes: workingHistory.notes,
        job_estimated_print_time: parseFloat(
          workingHistory.job.estimatedPrintTime
        ),
        job_actual_print_time: parseFloat(workingHistory.job.actualPrintTime),

        cost_printer: parseFloat(workingHistory.printerCost),
        cost_spool: parseFloat(workingHistory.spoolCost),
        cost_total: parseFloat(workingHistory.totalCost),
        cost_per_hour: parseFloat(workingHistory.costPerHour),
        total_volume: parseFloat(workingHistory.totalVolume),
        total_length: parseFloat(workingHistory.totalLength),
        total_weight: parseFloat(workingHistory.totalWeight)
      };
      let averagePrintTime = parseFloat(workingHistory.file.averagePrintTime);
      if (!isNaN(averagePrintTime)) {
        printerData["file_average_print_time"] = averagePrintTime;
      }
      let lastPrintTime = parseFloat(workingHistory.file.lastPrintTime);
      if (!isNaN(averagePrintTime)) {
        printerData["file_last_print_time"] = lastPrintTime;
      }

      if (typeof workingHistory.resend !== "undefined") {
        printerData["job_resends"] = `${workingHistory.resend.count} / ${
          workingHistory.resend.transmitted / 1000
        }K (${workingHistory.resend.ratio.toFixed(0)})`;
      }

      writePoints(tags, "HistoryInformation", printerData);
    }
  }

  static async updateFilamentInfluxDB(
    selectedFilament,
    history,
    previousFilament,
    printer
  ) {
    for (let i = 0; i < selectedFilament.length; i++) {
      if (selectedFilament[i] !== null) {
        let currentState = " ";
        let group = " ";
        if (printer.group === "") {
          group = " ";
        } else {
          group = printer.group;
        }
        if (history.success) {
          currentState = "Success";
        } else {
          if (history.reason === "cancelled") {
            currentState = "Cancelled";
          } else {
            currentState = "Failure";
          }
        }

        const tags = {
          name: selectedFilament[i].spools.name,
          printer_name: history.printerName,
          group: group,
          url: printer.printerURL,
          history_state: currentState,
          file_name: history.fileName
        };

        let used = 0;
        if (
          typeof previousFilament !== "undefined" &&
          previousFilament !== null
        ) {
          used = Math.abs(
            selectedFilament[i].spools.used - previousFilament[i].spools.used
          );
        }

        let filamentData = {
          name: selectedFilament[i].spools.name,
          price: parseFloat(selectedFilament[i].spools.price),
          weight: parseFloat(selectedFilament[i].spools.weight),
          used_difference: parseFloat(used),
          used_spool: parseFloat(selectedFilament[i].spools.used),
          temp_offset: parseFloat(selectedFilament[i].spools.tempOffset),
          spool_manufacturer: selectedFilament[i].spools.profile.manufacturer,
          spool_material: selectedFilament[i].spools.profile.material,
          spool_density: parseFloat(selectedFilament[i].spools.profile.density),
          spool_diameter: parseFloat(
            selectedFilament[i].spools.profile.diameter
          )
        };

        writePoints(tags, "SpoolInformation", filamentData);
      }
    }
  }

  static async complete(payload, printer, job, files, resends) {
    try {
      let serverSettings = await ServerSettings.find({});
      const previousFilament = JSON.parse(
        JSON.stringify(printer.selectedFilament)
      );
      let name = null;
      if (typeof printer.settingsApperance !== "undefined") {
        if (
          printer.settingsApperance.name === "" ||
          printer.settingsApperance.name === null
        ) {
          name = printer.printerURL;
        } else {
          name = printer.settingsApperance.name;
        }
      } else {
        name = printer.printerURL;
      }
      if (
        serverSettings[0]?.filamentManager &&
        Array.isArray(printer?.selectedFilament)
      ) {
        printer.selectedFilament = await HistoryCollection.resyncFilament(
          printer
        );
        logger.info(
          "Grabbed latest filament values",
          printer.filamentSelection
        );
      }
      logger.info("Completed Print triggered", payload + printer.printerURL);
      const today = new Date();
      const historyCollection = await History.find({});

      const printTime = new Date(payload.time * 1000);
      let startDate = today.getTime() - printTime.getTime();
      startDate = new Date(startDate);

      const startDDMM = startDate.toDateString();
      const startTime = startDate.toTimeString();
      const startTimeFormat = startTime.substring(0, 8);
      startDate = `${startDDMM} - ${startTimeFormat}`;

      const endDDMM = today.toDateString();
      const endTime = today.toTimeString();
      const endTimeFormat = endTime.substring(0, 8);
      const endDate = `${endDDMM} - ${endTimeFormat}`;
      const profiles = await filamentProfiles.find({});

      const selectedFilament = null;
      if (
        printer.selectedFilament !== null &&
        Array.isArray(printer.selectedFilament)
      ) {
        let profileId = [];
        printer.selectedFilament.forEach((spool, index) => {
          if (spool !== null) {
            if (serverSettings[0]?.filamentManager) {
              profileId = _.findIndex(profiles, function (o) {
                return (
                  o.profile.index ==
                  printer.selectedFilament[index].spools.profile
                );
              });
            } else {
              profileId = _.findIndex(profiles, function (o) {
                return o._id == printer.selectedFilament[index].spools.profile;
              });
            }
            printer.selectedFilament[index].spools.profile =
              profiles[profileId].profile;
          }
        });
      }
      if (historyCollection.length === 0) {
        counter = 0;
      } else {
        counter =
          historyCollection[historyCollection.length - 1].printHistory
            .historyIndex + 1;
      }

      const printHistory = {
        historyIndex: counter,
        printerName: name,
        printerID: printer._id,
        costSettings: printer.costSettings,
        success: true,
        reason: payload.reason,
        fileName: payload.name,
        fileDisplay: payload.display,
        filePath: payload.path,
        startDate,
        endDate,
        thumbnail: "",
        printTime: Math.round(payload.time),
        filamentSelection: printer.selectedFilament,
        previousFilamentSelection: previousFilament,
        job,
        notes: "",
        snapshot: "",
        resends: resends
      };

      HistoryCollection.updateFilamentInfluxDB(
        printer.selectedFilament,
        printHistory,
        previousFilament,
        printer
      );

      const saveHistory = new History({
        printHistory
      });
      await saveHistory.save().then(async (r) => {
        const thumbnail = await HistoryCollection.thumbnailCheck(
          payload,
          serverSettings[0],
          files,
          saveHistory._id,
          "onComplete",
          printer
        );
        let snapshot = "";
        if (printer.camURL !== "") {
          snapshot = await HistoryCollection.snapshotCheck(
            "onComplete",
            serverSettings[0],
            printer,
            saveHistory,
            payload
          );
        }

        if (serverSettings[0]?.history?.timelapse?.onComplete) {
          HistoryCollection.timelapseCheck(
            printer,
            payload.name,
            payload.time,
            serverSettings[0],
            saveHistory._id
          );
        }
        saveHistory.printHistory.thumbnail = thumbnail;
        saveHistory.printHistory.snapshot = snapshot;
        saveHistory.markModified("printHistory");
        saveHistory.save();
        printer.fileName = payload.display;
        printer.filePath = payload.path;
        ScriptRunner.check(printer, "done", saveHistory._id);
        await getHistoryCache().initCache();
        setTimeout(async function () {
          await getHistoryCache().initCache();
          HistoryCollection.updateInfluxDB(saveHistory._id, "history", printer);
        }, 5000);
      });

      logger.info(
        "Completed Print Captured for ",
        payload + printer.printerURL
      );
    } catch (e) {
      logger.error(e, `Failed to capture history for ${printer.printerURL}`);
    }
  }

  static async failed(payload, printer, job, files, resends) {
    try {
      const serverSettings = await ServerSettings.find({});
      const previousFilament = JSON.parse(
        JSON.stringify(printer.selectedFilament)
      );
      if (serverSettings[0]?.filamentManager) {
        printer.selectedFilament = await HistoryCollection.resyncFilament(
          printer
        );
        logger.info(
          "Grabbed latest filament values",
          printer.filamentSelection
        );
      }
      let name = null;
      if (typeof printer.settingsApperance !== "undefined") {
        if (
          printer.settingsApperance.name === "" ||
          printer.settingsApperance.name === null
        ) {
          name = printer.printerURL;
        } else {
          name = printer.settingsApperance.name;
        }
      } else {
        name = printer.printerURL;
      }
      logger.info("Failed Print triggered ", payload + printer.printerURL);
      const today = new Date();
      const historyCollection = await History.find({});

      const printTime = new Date(payload.time * 1000);
      let startDate = today.getTime() - printTime.getTime();
      startDate = new Date(startDate);

      const startDDMM = startDate.toDateString();
      const startTime = startDate.toTimeString();
      const startTimeFormat = startTime.substring(0, 8);
      startDate = `${startDDMM} - ${startTimeFormat}`;

      const endDDMM = today.toDateString();
      const endTime = today.toTimeString();
      const endTimeFormat = endTime.substring(0, 8);
      const endDate = `${endDDMM} - ${endTimeFormat}`;
      const profiles = await filamentProfiles.find({});

      const selectedFilament = null;
      if (
        printer.selectedFilament !== null &&
        Array.isArray(printer.selectedFilament)
      ) {
        let profileId = [];
        printer.selectedFilament.forEach((spool, index) => {
          if (spool !== null) {
            if (serverSettings[0]?.filamentManager) {
              profileId = _.findIndex(profiles, function (o) {
                return (
                  o.profile.index ==
                  printer.selectedFilament[index].spools.profile
                );
              });
            } else {
              profileId = _.findIndex(profiles, function (o) {
                return o._id == printer.selectedFilament[index].spools.profile;
              });
            }
            printer.selectedFilament[index].spools.profile =
              profiles[profileId].profile;
          }
        });
      }
      if (historyCollection.length === 0) {
        counter = 0;
      } else {
        counter =
          historyCollection[historyCollection.length - 1].printHistory
            .historyIndex + 1;
      }

      const printHistory = {
        historyIndex: counter,
        printerIndex: printer.index,
        costSettings: printer.costSettings,
        printerID: printer._id,
        printerName: name,
        success: false,
        reason: payload.reason,
        fileName: payload.name,
        filePath: payload.path,
        startDate,
        endDate,
        thumbnail: "",
        printTime: Math.round(payload.time),
        filamentSelection: printer.selectedFilament,
        previousFilamentSelection: previousFilament,
        job,
        notes: "",
        snapshot: "",
        timelapse: "",
        resends: resends
      };
      const saveHistory = new History({
        printHistory
      });

      HistoryCollection.updateFilamentInfluxDB(
        printer.selectedFilament,
        printHistory,
        previousFilament,
        printer
      );

      await saveHistory.save().then(async (r) => {
        const thumbnail = await HistoryCollection.thumbnailCheck(
          payload,
          serverSettings[0],
          files,
          saveHistory._id,
          "onFailure",
          printer
        );
        let snapshot = "";
        if (printer.camURL !== "") {
          snapshot = await HistoryCollection.snapshotCheck(
            "onFailure",
            serverSettings[0],
            printer,
            saveHistory,
            payload
          );
        }
        if (serverSettings[0]?.history?.timelapse?.onFailure) {
          HistoryCollection.timelapseCheck(
            printer,
            payload.name,
            payload.time,
            serverSettings[0],
            saveHistory._id
          );
        }

        saveHistory.printHistory.thumbnail = thumbnail;
        saveHistory.printHistory.snapshot = snapshot;
        saveHistory.markModified("printHistory");
        printer.fileName = payload.display;
        printer.filePath = payload.path;
        ScriptRunner.check(printer, "failed", saveHistory._id);
        await saveHistory.save();

        await getHistoryCache().initCache();
        setTimeout(async function () {
          await getHistoryCache().initCache();
          HistoryCollection.updateInfluxDB(saveHistory._id, "history", printer);
        }, 5000);
      });

      logger.info("Failed Print captured ", payload + printer.printerURL);
    } catch (e) {
      logger.error(e, `Failed to capture history for ${printer.printerURL}`);
    }
  }

  static async errorLog(payload, printer, job, files) {
    try {
      let name = null;
      if (typeof printer.settingsApperance !== "undefined") {
        if (
          printer.settingsApperance.name === "" ||
          printer.settingsApperance.name === null
        ) {
          name = printer.printerURL;
        } else {
          name = printer.settingsApperance.name;
        }
      } else {
        name = printer.printerURL;
      }
      logger.info(
        "Error Log Collection Triggered",
        payload + printer.printerURL
      );
      const today = new Date();
      const errorCollection = await ErrorLog.find({});

      const printTime = new Date(payload.time * 1000);
      let startDate = today.getTime() - printTime.getTime();
      startDate = new Date(startDate);

      const startDDMM = startDate.toDateString();
      const startTime = startDate.toTimeString();
      const startTimeFormat = startTime.substring(0, 8);
      startDate = `${startDDMM} - ${startTimeFormat}`;

      const endDDMM = today.toDateString();
      const endTime = today.toTimeString();
      const endTimeFormat = endTime.substring(0, 8);
      const endDate = `${endDDMM} - ${endTimeFormat}`;

      if (errorCollection.length === 0) {
        errorCounter = 0;
      } else {
        errorCounter =
          errorCollection[errorCollection.length - 1].errorLog.historyIndex + 1;
      }
      const errorLog = {
        historyIndex: errorCounter,
        printerIndex: printer.index,
        printerID: printer._id,
        costSettings: printer.costSettings,
        printerName: name,
        success: false,
        reason: payload.error,
        startDate,
        endDate,
        printTime: Math.round(payload.time),
        job: job,
        notes: ""
      };
      const saveError = new ErrorLog({
        errorLog
      });
      await saveError.save();
      await getHistoryCache().initCache();
      ScriptRunner.check(printer, "error", saveError._id);
      logger.info("Error captured ", payload + printer.printerURL);
    } catch (e) {
      logger.error(e, `Failed to capture ErrorLog for ${printer.printerURL}`);
    }
  }

  static history() {
    const printHistory = {
      printerIndex: 0,
      printerName: "",
      success: true,
      fileName: "",
      filePath: "",
      startDate: "",
      endDate: "",
      printTime: "",
      spoolUsed: "",
      filamentLength: 0,
      filamentVolume: 0,
      notes: ""
    };
    return printHistory;
  }

  static get(ip, port, apikey, item) {
    const url = `http://${ip}:${port}/api/${item}`;
    return fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apikey
      }
    });
  }
}

module.exports = {
  HistoryCollection
};
