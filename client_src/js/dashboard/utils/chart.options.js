import { toFixedFormatter } from "./chart.utils";

export const actualToolSeriesName = "Actual Tool";
export const defaultTheme = "dark";
export const defaultLoadingText = "Loading...";
export const darkColor = "#303030";
export const xAxisConnectionCategories = ["Active", "Complete", "Idle", "Disconnected", "Offline"];
export const utilisationConnectionLabels = ["Active", "Idle", "Offline"];
export const farmTempColors = ["#fcc329", "#ff1500", "#009cff", "#ff1800", "#37ff00", "#ff1800"];
export const utilisationConnectionColors = ["#00bc8c", "#444", "#e74c3c"];
export const historyColors = ["#00bc8c", "#f39c12", "#e74c3c"];
export const rainBow = () => [
  "#ff0000",
  "#ff8400",
  "#ffd500",
  "#88ff00",
  "#00ff88",
  "#00b7ff",
  "#4400ff",
  "#8000ff",
  "#ff00f2"
];
export const environmentalDataColors = ["#ff1500", "#324bca", "#caa932", "#49ca32"];

export const dataLabelBackground = {
  enabled: true,
  foreColor: "#000",
  padding: 1,
  borderRadius: 2,
  borderWidth: 1,
  borderColor: "#fff",
  opacity: 0.9
};

export function succesCountSeries(show = true) {
  return {
    title: {
      text: "Count"
    },
    seriesName: "Success",
    labels: {
      formatter: toFixedFormatter
    },
    show
  };
}

export const defaultHeatmapColorScaleOptions = {
  shadeIntensity: 0.5,
  radius: 0,
  useFillColorAsStroke: true,
  colorScale: {
    ranges: [
      {
        from: 0,
        to: 1,
        name: "none",
        color: "#848484"
      },
      {
        from: 2,
        to: 25,
        name: "low",
        color: "#375a7f"
      },
      {
        from: 26,
        to: 60,
        name: "medium",
        color: "#f39c12"
      },
      {
        from: 61,
        to: 75,
        name: "high",
        color: "#00bc8c"
      },
      {
        from: 76,
        to: 100,
        name: "extreme",
        color: "#e74c3c"
      }
    ]
  }
};

export const defaultEnvironmentalYAxisAnnotations = [
  {
    y: 0,
    y2: 50,
    yAxisIndex: 3,
    borderColor: "#24571f",
    fillColor: "#133614"
  },
  {
    y: 51,
    y2: 100,
    yAxisIndex: 3,
    borderColor: "#457a24",
    fillColor: "#31561a"
  },
  {
    y: 101,
    y2: 150,
    yAxisIndex: 3,
    borderColor: "#7a6f24",
    fillColor: "#564f1a"
  },
  {
    y: 151,
    y2: 200,
    yAxisIndex: 3,
    borderColor: "#5c3421",
    fillColor: "#3b3015"
  },
  {
    y: 201,
    y2: 250,
    yAxisIndex: 3,
    borderColor: "#5c2121",
    fillColor: "#3b1515"
  },
  {
    y: 251,
    y2: 350,
    yAxisIndex: 3,
    borderColor: "#37215c",
    fillColor: "#23153b"
  },
  {
    y: 350,
    yAxisIndex: 3,
    borderColor: "#280000",
    fillColor: "#000000"
  }
];
