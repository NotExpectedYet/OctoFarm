import "gridstack/dist/gridstack.min.css";
import "gridstack/dist/h5/gridstack-dd-native";
import OctoFarmclient from "./lib/octofarm.js";
import { bindGraphChangeUpdate, loadGrid } from "./dashboard/grid-stack.manager";
import { ChartsManager } from "./dashboard/charts.manager";
import { createClientSSEWorker } from "./lib/client-worker.js";
import { getUsageWeightSeries, toFixedWeightGramFormatter } from "./dashboard/utils/chart.utils";
import { DashUpdate } from "./dashboard/dashboard.updater";
import { dashboardSSEventHandler, workerURL } from "./dashboard/dashboard-sse.handler";

async function updateHistoryGraphs() {
  let historyStatistics = await OctoFarmclient.getHistoryStatistics();

  let historyGraphData = historyStatistics.history.historyByDay;
  let filamentUsageByDay = historyStatistics.history.totalByDay;
  let filamentUsageOverTime = historyStatistics.history.usageOverTime;

  await ChartsManager.updateFilamentOverTimeChartSeries(filamentUsageOverTime);
  await ChartsManager.updateFilamentUsageByDayChartSeries(filamentUsageByDay);
  await ChartsManager.updatePrintCompletionByDaySeries(historyGraphData);
}

async function initNewGraphs() {
  await ChartsManager.renderDefaultCharts();

  let historyStatistics = await OctoFarmclient.getHistoryStatistics();

  let printCompletionByDay = historyStatistics.history.historyByDay;
  let filamentUsageByDay = historyStatistics.history.totalByDay;
  let filamentUsageOverTime = historyStatistics.history.usageOverTime;

  let yAxisSeries = [];
  filamentUsageOverTime.forEach((usage, index) => {
    let obj = null;
    if (index === 0) {
      obj = {
        title: {
          text: "Weight"
        },
        seriesName: filamentUsageOverTime[0]?.name,
        labels: {
          formatter: toFixedWeightGramFormatter
        }
      };
    } else {
      obj = {
        show: false,
        seriesName: filamentUsageOverTime[0]?.name,
        labels: {
          formatter: toFixedWeightGramFormatter
        }
      };
    }
    yAxisSeries.push(obj);
  });
  await ChartsManager.renderFilamentUsageOverTimeChart(filamentUsageOverTime, yAxisSeries);

  const yAxis = [getUsageWeightSeries("Weight", filamentUsageByDay[0]?.name)];
  await ChartsManager.renderFilamentUsageByDayChart(filamentUsageByDay, yAxis);
  await ChartsManager.renderPrintCompletionByDay(printCompletionByDay);
}

createClientSSEWorker(workerURL, dashboardSSEventHandler);

loadGrid()
  .then(async () => {
    await initNewGraphs();
  })
  .then(() => {
    bindGraphChangeUpdate(async function (event, items) {
      await updateHistoryGraphs();
    });
  });
