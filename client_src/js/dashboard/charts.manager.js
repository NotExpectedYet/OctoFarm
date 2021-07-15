import ApexCharts from "apexcharts";
import { dashboardOptions } from "./dashboard.options";
import { getUsageWeightSeries } from "./utils/chart.utils";

const chartIds = {
  hourlyTotalTemperatureChart: "#hourlyTotalTemperatureChart",
  weeklyUtilisationPerDayHeatMap: "#weeklyUtilisationPerDayHeatMap",
  currentStatusChart: "#currentStatusChart",
  currentUtilisationChart: "#currentUtilisation",
  filamentUsageOverTimeChart: "#filamentUsageOverTimeChart",
  filamentUsageByDayChart: "#filamentUsageByDayChart",
  printCompletionByDayChart: "#printCompletionByDay",
  environmentalHistory: "#environmentalHistory"
};
let environmentDataChart,
  hourlyTotalTemperatureChart,
  weeklyUtilisationPerDayHeatMapChart,
  currentStatusChart,
  currentUtilisationChart,
  filamentUsageOverTimeChart,
  historyGraph,
  filamentUsageByDay;

/**
 * Render a chart by ID and providing chart options - safely skipping if the chart is not found
 * @param elementId
 * @param options
 * @param {{currentUtilisation: string, currentActivity: string, farmTemperature: string, daysActivityHeatmap: string}|string} elementId
 * @param {*} options
 */
async function renderChart(elementId, options) {
  const chartContainerElement = document.querySelector(elementId);
  if (chartContainerElement) {
    const chartElement = new ApexCharts(chartContainerElement, options);
    await chartElement.render();

    return chartElement;
  } else {
    console.debug("chart element", elementId, "not found");
  }
}

function updateChartSeries(chartElement, data) {
  if (!chartElement) {
    console.debug("chartelement was not found but data was pushed");
    return;
  }
  if (!!data) {
    chartElement.updateSeries(data);
  }
}

export class ChartsManager {
  /**
   * Render some known charts with known options
   * @returns {Promise<void>}
   */
  static async renderDefaultCharts() {
    hourlyTotalTemperatureChart = await renderChart(
      chartIds.hourlyTotalTemperatureChart,
      dashboardOptions.optionsHourlyTemperature
    );
    weeklyUtilisationPerDayHeatMapChart = await renderChart(
      chartIds.weeklyUtilisationPerDayHeatMap,
      dashboardOptions.optionsWeeklyUtilisationPerDayHeatMap
    );
    currentStatusChart = await renderChart(
      chartIds.currentStatusChart,
      dashboardOptions.currentStatusChartOptions
    );
    currentUtilisationChart = await renderChart(
      chartIds.currentUtilisationChart,
      dashboardOptions.optionsCurrentUtilisationChart
    );
  }

  static async renderFilamentUsageOverTimeChart(seriesData, yAxis) {
    dashboardOptions.filamentUsageOverTimeChartOptions.yaxis = yAxis;
    filamentUsageOverTimeChart = await renderChart(
      chartIds.filamentUsageOverTimeChart,
      dashboardOptions.filamentUsageOverTimeChartOptions
    );
    this.updateFilamentOverTimeChartSeries(seriesData);
  }

  static async renderFilamentUsageByDayChart(seriesData, yAxis) {
    dashboardOptions.filamentUsageByDayChartOptions.yaxis = yAxis;
    filamentUsageByDay = await renderChart(
      chartIds.filamentUsageByDayChart,
      dashboardOptions.filamentUsageByDayChartOptions
    );
    this.updateFilamentUsageByDayChartSeries(seriesData);
  }

  static async renderPrintCompletionByDay(seriesData) {
    historyGraph = await renderChart(
      chartIds.printCompletionByDayChart,
      dashboardOptions.printCompletionByDayChartOptions
    );
    this.updatePrintCompletionByDaySeries(seriesData);
  }

  /**
   * Gets dynamic labels as 2nd parameter
   * @param seriesData
   * @param labels analyzed labels
   */
  static async renderEnvironmentDataChart(seriesData, labels) {
    const environmentalHistoryChartOptions = dashboardOptions.environmentalDataChartOptions;
    environmentalHistoryChartOptions.yaxis = labels;
    environmentDataChart = await renderChart(
      chartIds.environmentalHistory,
      environmentalHistoryChartOptions
    );
    this.updateEnvironmentDataChart(seriesData);
  }

  static updateFilamentOverTimeChartSeries(seriesData) {
    updateChartSeries(filamentUsageOverTimeChart, seriesData);
  }

  static updateFilamentUsageByDayChartSeries(seriesData) {
    updateChartSeries(filamentUsageByDay, seriesData);
  }

  static updatePrintCompletionByDaySeries(seriesData) {
    updateChartSeries(historyGraph, seriesData);
  }

  static updateHourlyTotalTemperatureChart(seriesData) {
    updateChartSeries(hourlyTotalTemperatureChart, seriesData);
  }

  static updateCurrentUtilisation(seriesData) {
    updateChartSeries(currentUtilisationChart, seriesData);
  }

  static updateCurrentStatus(seriesData) {
    updateChartSeries(currentStatusChart, seriesData);
  }

  static updateWeeklyUtilisationPerDayHeatMapChart(seriesData) {
    updateChartSeries(weeklyUtilisationPerDayHeatMapChart, seriesData);
  }

  static updateEnvironmentDataChart(seriesData) {
    updateChartSeries(environmentDataChart, seriesData);
  }
}
