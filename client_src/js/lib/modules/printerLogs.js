import Calc from "../functions/calc.js";
import OctoFarmClient from "../octofarm.js";
import OctoPrintClient from "../octoprint.js";
import ApexCharts from "apexcharts";

let chart = null;
let historyBarChart = null;
let historyPieChart = null;
let eventListener = false;
let currentPrinter = null;

export default class PrinterLogs {
  static async parseLogs(printer, url) {
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey,
        Range: "bytes=-500000"
      }
    })
      .then(async (resp) => resp.blob())
      .then(async (blob) => blob.text())
      .then(async (text) => {
        let octoPrintCount = document.getElementById("octoPrintCount");
        let splitText = await text.split(/(\r\n|\n|\r)/gm);
        splitText = splitText.reverse();
        for (let i = 0; i < splitText.length; i++) {
          let colour = null;
          if (splitText[i].includes("INFO")) {
            colour = "Info";
          } else if (splitText[i].includes("WARNING")) {
            colour = "Active";
          } else if (splitText[i].includes("DEBUG")) {
            colour = "Offline";
          } else {
            colour = "Idle";
          }
          //Skip blank rows
          if (splitText[i].length > 1 && splitText[i] !== " ") {
            octologsLogsRows.insertAdjacentHTML(
              "beforeend",
              `
                                <tr class="${colour}">
                                  <th scope="row">${splitText.length - i}: ${splitText[i]}</th>
                                </tr>
                            `
            );
          }
        }
        octoPrintCount.innerHTML = "(" + (splitText.length / 2).toFixed(0) + ")";
      });
  }
  static loadLogs(printer, connectionLogs) {
    currentPrinter = printer;
    document.getElementById("printerLogsTitle").innerHTML = "Printer Logs: " + printer.printerName;
    let printerRows = document.getElementById("printerConnectionLogRows");
    let printerErrorRows = document.getElementById("printerErrorLogRows");
    let octoprintLogsRows = document.getElementById("octoprintLogsRows");
    let octologsLogsRows = document.getElementById("octologsLogsRows");
    let logCount = document.getElementById("logCount");
    let octoCount = document.getElementById("octoCount");
    let errorCount = document.getElementById("errorCount");
    let octoPrintCount = document.getElementById("octoPrintCount");
    let tempCount = document.getElementById("tempCount");
    let tempChart = document.getElementById("printerTempChart");
    let logSelect = document.getElementById("octoPrintLogsSelect");

    logCount.innerHTML = '(<i class="fas fa-spinner fa-spin"></i>)';
    errorCount.innerHTML = '(<i class="fas fa-spinner fa-spin"></i>)';
    tempCount.innerHTML = '(<i class="fas fa-spinner fa-spin"></i>)';
    octoCount.innerHTML = '(<i class="fas fa-spinner fa-spin"></i>)';
    octoPrintCount.innerHTML = '(<i class="fas fa-spinner fa-spin"></i>)';

    printerRows.innerHTML = "";
    printerErrorRows.innerHTML = "";
    octoprintLogsRows.innerHTML = "";
    octologsLogsRows.innerHTML = "";
    //tempChart.innerHTML = "";
    OctoPrintClient.get(printer, "/plugin/logging/logs")
      .then(async (res) => res.json())
      .then(async (res) => {
        let mainLog = _.findIndex(res.files, function (o) {
          return o.name === "octoprint.log";
        });
        let orderedSelect = _.sortBy(res.files, [
          function (o) {
            return o.name;
          }
        ]);
        logSelect.innerHTML = "";
        for (let i = 0; i < orderedSelect.length; i++) {
          logSelect.insertAdjacentHTML(
            "beforeend",
            `
            <option value="${orderedSelect[i].refs.download}">${orderedSelect[i].name}</option>
          `
          );
        }

        logSelect.value = res.files[mainLog].refs.download;
        PrinterLogs.parseLogs(printer, res.files[mainLog].refs.download);
      })
      .catch((e) => {
        console.log(e);
      });

    if (typeof connectionLogs.currentOctoFarmLogs === "object") {
      for (let i = 0; i < connectionLogs.currentOctoPrintLogs.length; i++) {
        tempCount.innerHTML = "(0)";
        let log = connectionLogs.currentOctoPrintLogs[i];
        octoprintLogsRows.insertAdjacentHTML(
          "beforeend",
          `
            <tr class="${log.state}">
              <th scope="row">${Calc.dateClean(log.date)}</th>
              <td>${log.printer}</td>
              <td>${log.pluginDisplay}</td>
              <td>${log.message}</td>
            </tr>
        `
        );
      }
      octoCount.innerHTML = `(${connectionLogs.currentOctoPrintLogs.length})`;
      for (let i = 0; i < connectionLogs.currentOctoFarmLogs.length; i++) {
        let log = connectionLogs.currentOctoFarmLogs[i];
        printerRows.insertAdjacentHTML(
          "beforeend",
          `
            <tr class="${log.state}">
              <th scope="row">${Calc.dateClean(log.date)}</th>
              <td>${log.printer}</td>
              <td>${log.message}</td>
            </tr>
      `
        );
      }
      logCount.innerHTML = `(${connectionLogs.currentOctoFarmLogs.length})`;
      for (let i = 0; i < connectionLogs.currentErrorLogs.length; i++) {
        let log = connectionLogs.currentErrorLogs[i];
        printerErrorRows.insertAdjacentHTML(
          "beforeend",
          `
            <tr class="${log.state}">
              <th scope="row">${log.date}</th>
              <td>${log.printer}</td>
              <td>${log.message}</td>
            </tr>
      `
        );
      }
      errorCount.innerHTML = `(${connectionLogs.currentErrorLogs.length})`;
      tempCount.innerHTML = "(0)";
      if (
        typeof connectionLogs.currentTempLogs !== "undefined" &&
        connectionLogs.currentTempLogs.length > 0
      ) {
        tempCount.innerHTML = `(${connectionLogs.currentTempLogs[0].data.length})`;
        const options = {
          chart: {
            type: "line",
            width: "100%",
            height: "500px",
            animations: {
              enabled: false
            },
            toolbar: {
              show: false
            },
            zoom: {
              enabled: false
            },
            background: "#303030"
          },
          colors: [
            "#fc2929",
            "#3e0b0b",
            "#00ffae",
            "#003b28",
            "#fff200",
            "#9b9300",
            "#5900ff",
            "#190147",
            "#e600ff",
            "#5d0167",
            "#ffb700",
            "#5a4001",
            "#93fc29",
            "#2d4c0d",
            "#ff0084",
            "#450124"
          ],
          stroke: {
            curve: "smooth"
          },
          toolbar: {
            show: false
          },
          theme: {
            mode: "dark"
          },
          noData: {
            text: "Loading..."
          },
          series: [],
          yaxis: [
            {
              title: {
                text: "Temperature"
              },
              labels: {
                formatter(value) {
                  if (value !== null) {
                    return `${value}°C`;
                  }
                }
              }
            }
          ],
          xaxis: {
            //tickAmount: "dataPoints",
            type: "category",
            labels: {
              formatter(value) {
                const date = new Date(value);
                var weekday = new Array(7);
                weekday[0] = "Sun";
                weekday[1] = "Mon";
                weekday[2] = "Tue";
                weekday[3] = "Wed";
                weekday[4] = "Thu";
                weekday[5] = "Fri";
                weekday[6] = "Sat";
                return (
                  weekday[date.getDay()] + " " + date.getDate() + " " + date.toLocaleTimeString()
                );
              }
            }
          }
        };
        if (connectionLogs.currentTempLogs.length === 0) {
          tempChart.innerHTML = "<div class=''>No Records to Show</div>";
        }
        if (chart !== null) {
          chart.destroy();
          chart = new ApexCharts(tempChart, options);
          chart.render();
          chart.updateSeries(connectionLogs.currentTempLogs);
        } else {
          chart = new ApexCharts(tempChart, options);
          chart.render();
          chart.updateSeries(connectionLogs.currentTempLogs);
        }
      } else {
        tempChart.innerHTML = "<div class=''>No Records to Show</div>";
      }
    }

    if (!eventListener) {
      logSelect.addEventListener("change", (e) => {
        octologsLogsRows.innerHTML = "";

        octoPrintCount.innerHTML = '(<i class="fas fa-spinner fa-spin"></i>)';
        PrinterLogs.parseLogs(printer, e.target.value);
      });
      document.getElementById("system-refresh-list").addEventListener("click", async (e) => {
        console.log("Refresh!", currentPrinter.printerURL);
        let connectionLogs = await OctoFarmClient.get(
          "printers/connectionLogs/" + currentPrinter._id
        );
        connectionLogs = await connectionLogs.json();
        PrinterLogs.loadLogs(currentPrinter, connectionLogs);
      });
      eventListener = true;
    }
  }
  static async returnPrinterStatsTemplate(stats) {
    let display = "";
    let noHistoryMessage = "";
    let safeModeCheck = "";
    if (stats.octoPrintSystemInfo["octoprint.safe_mode"]) {
      safeModeCheck = `
      <i title="You are not in safe mode, all is fine" class="fas fa-thumbs-down text-success"></i>
      `;
    } else {
      safeModeCheck = `
      <i title="Something wrong with your system? Detecting safe mode" class="fas fa-thumbs-up text-success"></i>
      `;
    }
    if (stats.historyByDay.length === 0) {
      noHistoryMessage = `<div class='row'>
                    <div class="col-12"><h5>Sorry but your printer currently has no history captured. Please run some prints to generate information here.</h5></div>
                </div>`;
      display = "d-none";
    }
    let printerFirmware = "Unknown";
    if (typeof stats.octoPrintSystemInfo["printer.firmware"] !== "undefined") {
      printerFirmware = stats.octoPrintSystemInfo["printer.firmware"];
    }
    return `
            <div class="col-md-12 col-lg-4">
              <div class="card text-white bg-dark mb-3" >
                              <div class="card-header">Information</div>
                              <div class="card-body">
                              <p class="card-text">
                              <div class="row">
                                <div class="col-md-12 col-lg-6">
                                   <small><b>OctoPrint Version:</b> ${
                                     stats.octoPrintSystemInfo["octoprint.version"]
                                   }</small><br>
                                    <small><b>Printer Firmware:</b> ${printerFirmware}</small><br>
                                    <small><b>Python Version:</b> ${
                                      stats.octoPrintSystemInfo["env.python.version"]
                                    }</small>   <br>     
                                       <small><b>pip Version:</b> ${
                                         stats.octoPrintSystemInfo["env.python.pip"]
                                       }</small>        <br>                          
                                </div>
                                  <div class="col-md-12 col-lg-6">
                                   <small><b>OS Platform:</b> ${
                                     stats.octoPrintSystemInfo["env.os.platform"]
                                   }</small><br>
                                   <small><b>OS Cores:</b> ${
                                     stats.octoPrintSystemInfo["env.hardware.cores"]
                                   }</small><br>
                                    <small><b>OS ram:</b> ${Calc.bytes(
                                      stats.octoPrintSystemInfo["env.hardware.ram"]
                                    )}</small><br>
                                     <small><b>Safe Mode Check:</b> ${safeModeCheck} </small><br>
                                </div>
                              </div>
     
                                </p>
                </div>
              </div>
            </div>
            <div class="col-md-12 col-lg-4">
              <div class="card text-white bg-dark mb-3" >
                              <div class="card-header">Utilisation</div>
                              <div class="card-body">
                                <div class='card-text' id='printerUtilisationGraph'></div>
                </div>
              </div>
            </div>
            <div class="col-md-12 col-lg-4">
                <div class="card text-white bg-dark mb-3">
                              <div class="card-header">Printer Issues</div>
                           
                              <div class="card-body">
                                  <div class="row">
                                        <div class="col-6">
                                                    
                              <p class="card-text">
                                <span><i class="fas fa-square text-success"></i> <b>Todays Errors</b> <br> ${
                                  stats.printErrorDay
                                } </span>
                                <br>
                                <span><i class="fas fa-square text-secondary"></i> <b>Previous Weeks Errors</b> <br> ${
                                  stats.printerErrorWeek
                                }</span>
                                <br>
                                <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Total Errors</b><br> ${
                                  stats.printErrorTotal
                                }</span>
                                </p>
                                        </div>
                                        <div class="col-6">
                                                
                                      <p class="card-text">
                                        <span><i class="fas fa-square text-success"></i> <b>Todays Resends % </b> <br> ${
                                          stats.printerResendRatioDaily
                                        } </span>
                                        <br>
                                        <span><i class="fas fa-square text-secondary"></i> <b>Previous Weeks Resends %</b> <br> ${
                                          stats.printerResendRatioWeekly
                                        }</span>
                                        <br>
                                        <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Total Resends %</b><br> ${
                                          stats.printerResendRatioTotal
                                        }</span>
                                        </p>
                                        </div>
                                  </div>
                          
                </div>
              </div>
            </div>

            <div class="col-md-6 col-lg-3">
              <div class="card text-white bg-dark mb-3">
                <div class="card-header">Age</div>
                <div class="card-body">
                  <p class="card-text">${Calc.generateTime(stats.timeTotal / 1000)}</p>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-3">
              <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Total Cost</div>
                <div class="card-body">
                  <p class="card-text">                ${Calc.generateCost(
                    stats.printerCostTotal
                  )}</p>
                </div>
              </div>

            
            </div>
            <div class="col-md-6 col-lg-3">
                          <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Total Filament Usage (g)</div>
                <div class="card-body">
                  <p class="card-text">                ${Calc.generateCost(
                    stats.filamentUsedLengthTotal
                  )}</p>
                </div>
              </div>

            </div>
            <div class="col-md-6 col-lg-3">
                               <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Total Filament Usage (m)</div>
                <div class="card-body">
                  <p class="card-text">                ${Calc.generateCost(
                    stats.filamentUsedWeightTotal
                  )}</p>
                </div>
              </div>
            </div>
            <div class="col-12">
                ${noHistoryMessage}
                <div class="${display}" id='historyGraph'></div>
            </div>
            <div class="col-md-6 col-lg-3">
            
              <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Printer Usage</div>
                <div class="card-body">
                  <p class="card-text">    <span><i class="fas fa-square text-success"></i> <b>Active Hours </b> <br> ${Calc.generateTime(
                    stats.activeTimeTotal / 1000
                  )}</span>
              <br>
              <span><i class="fas fa-square text-secondary"></i> <b>Idle Hours </b> <br> ${Calc.generateTime(
                stats.idleTimeTotal / 1000
              )}</span>
              <br>
              <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Offline Hours </b><br> ${Calc.generateTime(
                stats.offlineTimeTotal / 1000
              )}</span></p>
                </div>
              </div>
            
         
            </div>
            <div class="col-md-6 col-lg-3">
                          <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Print Totals for Today</div>
                <div class="card-body">
                  <p class="card-text">    <span><i class="fas fa-square text-success"></i> <b>Successful</b> <br> ${
                    stats.printSuccessDay
                  }</span>
              <br>
              <span><i class="fas fa-square text-secondary"></i> <b>Cancelled</b> <br> ${
                stats.printCancelDay
              }</span>
              <br>
              <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Failed</b><br> ${
                stats.printErrorDay
              }</span>
            </p>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-3">
                          <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Print Totals for Last Seven Days</div>
                <div class="card-body">
                  <p class="card-text"> 
                 <span><i class="fas fa-square text-success"></i> <b>Successful </b> <br> ${
                   stats.printerSuccessWeek
                 }</span>

                        <br>
                        <span><i class="fas fa-square text-secondary"></i> <b>Cancelled </b> <br> ${
                          stats.printerCancelWeek
                        }</span>
                        <br>
                        <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Failed </b><br> ${
                          stats.printerErrorWeek
                        }</span>
            
                  </p>
                </div>
              </div>

            </div>
            <div class="col-md-6 col-lg-3">
                          <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Print Totals All Time</div>
                <div class="card-body">
                  <p class="card-text">  
                                 <span><i class="fas fa-square text-success"></i> <b>Successful</b> <br> ${
                                   stats.printSuccessTotal
                                 }</span>
                <br>
                <span><i class="fas fa-square text-secondary"></i> <b>Cancelled</b> <br> ${
                  stats.printCancelTotal
                }</span>
                <br>
                <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Failed</b><br> ${
                  stats.printErrorTotal
                }</span>
                        
                   </p>
                </div>
              </div>


            </div>
    
            <div class="col-md-6 col-lg-3">

            </div>
            </div>
            <div class="col-md-6 col-lg-3">
            <div class="card text-white bg-dark mb-3" >
              <div class="card-header">Filament Usage Today</div>
              <div class="card-body">
                    <p class="card-text">  
                        <span><i class="fas fa-toilet-paper text-secondary"></i> <b>Cost </b> <br> ${Calc.generateCost(
                          stats.filamentCostDay
                        )}</span>
                      <br>
                      <span><i class="fas fa-toilet-paper text-secondary"></i> <b>Length </b> <br> ${Calc.generateCost(
                        stats.filamentLengthDay
                      )}</span>m
                      <br>
                      <span class="pb-4"><i class="fas fa-toilet-paper text-secondary"></i> <b>Weight </b><br> ${Calc.generateCost(
                        stats.filamentWeightDay
                      )}</span>g
                              
                         </p>
              </div>
            </div>
            </div>
            <div class="col-md-6 col-lg-3">
            <div class="card text-white bg-dark mb-3" >
              <div class="card-header">Filament Usage Last Seven Days</div>
              <div class="card-body">
                                    <p class="card-text">  
                        <span><i class="fas fa-toilet-paper text-secondary"></i> <b>Cost </b> <br> ${Calc.generateCost(
                          stats.filamentCostWeek
                        )}</span>
                      <br>
                      <span><i class="fas fa-toilet-paper text-secondary"></i> <b>Length </b> <br> ${Calc.generateCost(
                        stats.filamentLengthWeek
                      )}</span>m
                      <br>
                      <span class="pb-4"><i class="fas fa-toilet-paper text-secondary"></i> <b>Weight </b><br> ${Calc.generateCost(
                        stats.filamentWeightWeek
                      )}</span>g
                              
                         </p>
              </div>
            </div>
            </div>
            <div class="col-md-6 col-lg-3">
            <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Filament Usage All Time</div>
                <div class="card-body">
                                      <p class="card-text">  
                        <span><i class="fas fa-toilet-paper text-secondary"></i> <b>Cost </b> <br> ${Calc.generateCost(
                          stats.filamentCostTotal
                        )}</span>
                      <br>
                      <span><i class="fas fa-toilet-paper text-secondary"></i> <b>Length </b> <br> ${Calc.generateCost(
                        stats.filamentUsedLengthTotal
                      )}</span>m
                      <br>
                      <span class="pb-4"><i class="fas fa-toilet-paper text-secondary"></i> <b>Weight </b><br> ${Calc.generateCost(
                        stats.filamentUsedWeightTotal
                      )}</span>g
                              
                         </p>
                </div>
              </div>
     
            </div>
    `;
  }
  static async loadStatistics(id) {
    let get = await OctoFarmClient.get("history/statistics/" + id);
    get = await get.json();
    //Setup page
    let printerStatsWrapper = document.getElementById("printerStatistics");
    printerStatsWrapper.innerHTML = "";
    printerStatsWrapper.innerHTML = await this.returnPrinterStatsTemplate(get);
    document.getElementById("printerStatisticsTitle").innerHTML =
      "Printer Statistics: " + get.printerName;
    //Check if graph is on DOM...
    const printerHistoryOptions = {
      chart: {
        type: "bar",
        width: "100%",
        height: "250px",
        stacked: true,
        stroke: {
          show: true,
          curve: "smooth",
          lineCap: "butt",
          width: 1,
          dashArray: 0
        },
        animations: {
          enabled: true
        },
        plotOptions: {
          bar: {
            horizontal: false
          }
        },
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        background: "#303030"
      },
      dataLabels: {
        enabled: false,
        background: {
          enabled: true,
          foreColor: "#000",
          padding: 1,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: "#fff",
          opacity: 0.9
        },
        formatter: function (val, opts) {
          if (val !== null) {
            return val.toFixed(0) + "g";
          }
        }
      },
      colors: [
        "#00bc8c",
        "#f39c12",
        "#e74c3c",
        "#88ff00",
        "#00ff88",
        "#00b7ff",
        "#4400ff",
        "#8000ff",
        "#ff00f2"
      ],
      toolbar: {
        show: false
      },
      theme: {
        mode: "dark"
      },
      noData: {
        text: "Loading..."
      },
      series: [],
      yaxis: [
        {
          title: {
            text: "Count"
          },
          seriesName: "Success",
          labels: {
            formatter: function (val) {
              if (val !== null) {
                return val.toFixed(0);
              }
            }
          }
        },
        {
          title: {
            text: "Count"
          },
          seriesName: "Success",
          labels: {
            formatter: function (val) {
              if (val !== null) {
                return val.toFixed(0);
              }
            }
          },
          show: false
        },
        {
          title: {
            text: "Count"
          },
          seriesName: "Success",
          labels: {
            formatter: function (val) {
              if (val !== null) {
                return val.toFixed(0);
              }
            }
          },
          show: false
        }
      ],
      xaxis: {
        type: "datetime",
        tickAmount: 10,
        labels: {
          formatter: function (value, timestamp) {
            let dae = new Date(timestamp);
            return dae.toLocaleDateString(); // The formatter function overrides format property
          }
        }
      }
    };
    if (historyBarChart !== null) {
      historyBarChart.destroy();
      historyBarChart = new ApexCharts(
        document.querySelector("#historyGraph"),
        printerHistoryOptions
      );
      historyBarChart.render();
      historyBarChart.updateSeries(get.historyByDay);
    } else {
      historyBarChart = new ApexCharts(
        document.querySelector("#historyGraph"),
        printerHistoryOptions
      );
    }
    const optionsUtilisation = {
      chart: {
        type: "donut",
        width: "100%",
        height: "100%",
        animations: {
          enabled: true
        },
        background: "#303030"
      },
      theme: {
        mode: "dark"
      },
      plotOptions: {
        pie: {
          expandOnClick: false,
          dataLabels: {
            offset: 10,
            minAngleToShowLabel: 15
          }
        }
      },
      stroke: {
        show: false
      },
      tooltip: {
        y: {
          formatter(val) {
            return `${Math.round(val * 10) / 10}%`;
          }
        }
      },
      noData: {
        text: "Loading..."
      },
      dataLabels: {
        enabled: false
      },
      series: [],
      labels: ["Active", "Idle", "Offline"],
      colors: ["#00bc8c", "#444", "#e74c3c"],
      legend: {
        show: true,
        showForSingleSeries: false,
        showForNullSeries: true,
        showForZeroSeries: true,
        position: "bottom",
        horizontalAlign: "center",
        floating: false,
        fontSize: "11px",
        fontFamily: "Helvetica, Arial",
        fontWeight: 400,
        formatter: undefined,
        inverseOrder: false,
        width: undefined,
        height: undefined,
        tooltipHoverFormatter: undefined,
        offsetX: -25,
        offsetY: 0,
        labels: {
          colors: undefined,
          useSeriesColors: false
        },
        markers: {
          width: 9,
          height: 9,
          strokeWidth: 0,
          strokeColor: "#fff",
          fillColors: undefined,
          radius: 1,
          customHTML: undefined,
          onClick: undefined,
          offsetX: 0,
          offsetY: 0
        },
        itemMargin: {
          horizontal: 1,
          vertical: 0
        },
        onItemClick: {
          toggleDataSeries: false
        },
        onItemHover: {
          highlightDataSeries: false
        }
      }
    };
    if (historyPieChart !== null) {
      historyPieChart.destroy();
      historyPieChart = new ApexCharts(
        document.querySelector("#printerUtilisationGraph"),
        optionsUtilisation
      );
      historyPieChart.render();
      historyPieChart.updateSeries(get.printerUtilisation);
    } else {
      historyPieChart = new ApexCharts(
        document.querySelector("#printerUtilisationGraph"),
        optionsUtilisation
      );
    }
    historyPieChart.render();
    historyPieChart.updateSeries(get.printerUtilisation);
    historyBarChart.render();
    historyBarChart.updateSeries(get.historyByDay);
  }
}
