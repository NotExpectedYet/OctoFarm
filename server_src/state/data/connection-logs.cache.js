class ConnectionLogsCache {
  #currentLogs = [];
  #previousLogs = [];
  #printerConnectionLogs = [];

  async sortTerminal(i, logs) {
    if (typeof logs !== "undefined") {
      if (!this.#currentLogs[i]) {
        this.#currentLogs[i] = [];
      } else {
        if (logs.length === 1) {
          if (this.#currentLogs[i][this.#currentLogs[i].length - 1] !== logs[0]) {
            this.#currentLogs[i].push(logs[0]);
          }
          if (this.#currentLogs[i].length >= 100) {
            this.#currentLogs[i].shift();
          }
        } else {
          for (let l = 0; l < logs.length; l++) {
            if (this.#currentLogs[i][this.#currentLogs[i].length - 1] !== logs[l]) {
              this.#currentLogs[i].push(logs[l]);
            }
            if (this.#currentLogs[i].length >= 100) {
              this.#currentLogs[i].shift();
            }
          }
          this.#previousLogs[i] = this.#currentLogs[i];
        }
      }
    } else {
      this.#currentLogs[i] = [];
    }
    return this.#currentLogs[i];
  }

  // async generateConnectionLogs(farmPrinter) {
  //   let printerErrorLogs = await ErrorLogs.find({});
  //
  //   let currentOctoFarmLogs = [];
  //   let currentErrorLogs = [];
  //   let currentTempLogs = [];
  //   let currentOctoPrintLogs = [];
  //   for (let e = 0; e < printerErrorLogs.length; e++) {
  //     if (
  //       typeof printerErrorLogs[e].errorLog.printerID !== "undefined" &&
  //       JSON.stringify(printerErrorLogs[e].errorLog.printerID) === JSON.stringify(farmPrinter._id)
  //     ) {
  //       let errorFormat = {
  //         date: printerErrorLogs[e].errorLog.endDate,
  //         message: printerErrorLogs[e].errorLog.reason,
  //         printer: farmPrinter.printerURL,
  //         state: "Offline"
  //       };
  //       currentErrorLogs.push(errorFormat);
  //     }
  //   }
  //   let currentIssues = await PrinterTickerStore.returnIssue();
  //   for (let i = 0; i < currentIssues.length; i++) {
  //     if (JSON.stringify(currentIssues[i].printerID) === JSON.stringify(farmPrinter._id)) {
  //       let errorFormat = {
  //         date: currentIssues[i].date,
  //         message: currentIssues[i].message,
  //         printer: currentIssues[i].printer,
  //         state: currentIssues[i].state
  //       };
  //       currentOctoFarmLogs.push(errorFormat);
  //     }
  //   }
  //
  //   let octoprintLogs = await PrinterTickerStore.returnOctoPrintLogs();
  //   for (let i = 0; i < octoprintLogs.length; i++) {
  //     if (JSON.stringify(octoprintLogs[i].printerID) === JSON.stringify(farmPrinter._id)) {
  //       let octoFormat = {
  //         date: octoprintLogs[i].date,
  //         message: octoprintLogs[i].message,
  //         printer: octoprintLogs[i].printer,
  //         pluginDisplay: octoprintLogs[i].pluginDisplay,
  //         state: octoprintLogs[i].state
  //       };
  //       currentOctoPrintLogs.push(octoFormat);
  //     }
  //   }
  //
  //   let tempHistory = await TempHistory.find({
  //     printer_id: farmPrinter._id
  //   })
  //     .sort({ _id: -1 })
  //     .limit(500);
  //   if (typeof tempHistory !== "undefined") {
  //     for (let h = 0; h < tempHistory.length; h++) {
  //       let hist = tempHistory[h].currentTemp;
  //       const reFormatTempHistory = async function (tempHistory) {
  //         // create a new object to store full name.
  //         let keys = Object.keys(tempHistory);
  //         let array = [];
  //
  //         for (let k = 0; k < keys.length; k++) {
  //           if (keys[k] !== "time") {
  //             let target = {};
  //             let actual = {};
  //             target = {
  //               name: keys[k] + "-target",
  //               data: []
  //             };
  //             actual = {
  //               name: keys[k] + "-actual",
  //               data: []
  //             };
  //             array.push(target);
  //             array.push(actual);
  //           }
  //         }
  //
  //         // return our new object.
  //         return array;
  //       };
  //       currentTempLogs = await reFormatTempHistory(hist);
  //     }
  //     if (currentTempLogs.length > 0) {
  //       for (let h = 0; h < tempHistory.length; h++) {
  //         let hist = tempHistory[h].currentTemp;
  //         let keys = Object.keys(hist);
  //         for (let k = 0; k < keys.length; k++) {
  //           if (keys[k] !== "time") {
  //             let actual = {
  //               x: hist["time"],
  //               y: hist[keys[k]].actual
  //             };
  //             let target = {
  //               x: hist["time"],
  //               y: hist[keys[k]].target
  //             };
  //
  //             //get array position...
  //             let arrayTarget = currentTempLogs
  //               .map(function (e) {
  //                 return e.name;
  //               })
  //               .indexOf(keys[k] + "-target");
  //             let arrayActual = currentTempLogs
  //               .map(function (e) {
  //                 return e.name;
  //               })
  //               .indexOf(keys[k] + "-actual");
  //             if (currentTempLogs[arrayTarget].data.length <= tempHistory.length) {
  //               currentTempLogs[arrayTarget].data.push(target);
  //             }
  //             if (currentTempLogs[arrayActual].data.length <= tempHistory.length) {
  //               currentTempLogs[arrayActual].data.push(actual);
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  //
  //   currentErrorLogs = _.orderBy(currentErrorLogs, ["date"], ["desc"]);
  //   currentOctoFarmLogs = _.orderBy(currentOctoFarmLogs, ["date"], ["desc"]);
  //   currentTempLogs = _.orderBy(currentTempLogs, ["date"], ["desc"]);
  //   currentOctoPrintLogs = _.orderBy(currentOctoPrintLogs, ["date"], ["desc"]);
  //
  //   return {
  //     currentErrorLogs,
  //     currentOctoFarmLogs,
  //     currentTempLogs,
  //     currentOctoPrintLogs
  //   };
  // }
}

module.export = ConnectionLogsCache;
