import {
  actualToolSeriesName,
  darkColor,
  dataLabelBackground,
  defaultLoadingText,
  defaultTheme
} from "./chart.options";
import Calc from "../../lib/functions/calc";

export const toFixedTempCelciusFormatter = (value) => {
  return `${value}°C`;
};

export const toFixedFormatter = (value) => {
  if (value !== null) {
    return value.toFixed(0);
  }
};

export const toFixedWeightGramFormatter = (value) => {
  if (value !== null) {
    return value.toFixed(0) + "g";
  } else {
    return "";
  }
};

export function valueToLocaleTimeStringFormatter(value) {
  return new Date(value).toLocaleTimeString();
}

export function valueToLocaleDateStringFormatter(value) {
  return new Date(value).toLocaleDateString();
}

export function timestampToLocaleDateStringFormatter(value, timestamp) {
  return new Date(timestamp).toLocaleDateString();
}

export function percentageFormatter(value) {
  return `${value}%`;
}

export function indoorAirQualityFormatter(value) {
  let state = null;
  if (value === null) {
    return "";
  } else {
    if (Calc.isBetween(value, 0, 50)) {
      state = "Excellent";
    }
    if (Calc.isBetween(value, 51, 100)) {
      state = "Good";
    }
    if (Calc.isBetween(value, 101, 150)) {
      state = "Lightly Polluted";
    }
    if (Calc.isBetween(value, 151, 200)) {
      state = "Moderately Polluted";
    }
    if (Calc.isBetween(value, 201, 250)) {
      state = "Heavily Polluted";
    }
    if (Calc.isBetween(value, 251, 350)) {
      state = "Severely Polluted";
    }
    if (Calc.isBetween(value, 350, 500)) {
      state = "Extremely Polluted";
    }
  }
  return `${value}: ${state}`;
}
export function pascalPressureFormatter(value) {
  if (value !== null) {
    return `${value} Pa`;
  } else {
    return "";
  }
}

export function clippedPercentageFormatter(value) {
  return `${Math.round(value * 10) / 10}%`;
}

export function noZoom() {
  return {
    zoom: {
      enabled: false
    }
  };
}

export function defaultDarkColor() {
  return darkColor;
}

export function defaultBackground() {
  return {
    background: defaultDarkColor()
  };
}

export function noopFormatter(value) {
  return value;
}

export function tooltipDataPointFormatter(val, opt) {
  return `${opt.w.globals.labels[opt.dataPointIndex]}:  `;
}

export function defaultChartWidth() {
  return {
    width: "100%"
  };
}

export function fullChartDimensions() {
  return {
    width: "100%",
    height: "100%"
  };
}

export function defaultChartDimensions() {
  return {
    ...defaultChartWidth(),
    height: "90%"
  };
}

export function theme() {
  return {
    theme: {
      mode: defaultTheme
    }
  };
}

export function loadingText() {
  return {
    noData: {
      text: defaultLoadingText
    }
  };
}

export function showToolbar(enabled = false) {
  return {
    toolbar: {
      show: enabled
    }
  };
}

export function enableAnimations(enabled = false) {
  return {
    animations: {
      enabled
    }
  };
}

export function showStroke(enabled = false) {
  return {
    stroke: {
      show: enabled
    }
  };
}

export function defaultDataLabelBackground() {
  return dataLabelBackground;
}

export function getDefaultWeightDataLabelFormat() {
  return {
    enabled: false,
    background: defaultDataLabelBackground,
    formatter: toFixedWeightGramFormatter
  };
}

export function getChartLabel(shortName, seriesName, formatter, min, max) {
  return {
    title: {
      text: shortName
    },
    seriesName: seriesName,
    labels: {
      formatter: formatter
    },
    min,
    max
  };
}

export function getToolTempSeries(titleText) {
  return {
    title: {
      text: titleText
    },
    seriesName: actualToolSeriesName,
    labels: {
      formatter: toFixedTempCelciusFormatter
    }
  };
}

export function getUsageWeightSeries(titleText, seriesName) {
  return {
    title: {
      text: titleText
    },
    seriesName: seriesName,
    labels: {
      formatter: toFixedWeightGramFormatter
    }
  };
}

export function getHiddenToolTempRepeated(count) {
  const hiddenToolSeries = {
    seriesName: actualToolSeriesName,
    show: false,
    labels: {
      formatter: toFixedTempCelciusFormatter
    }
  };

  const templateSeriesStringified = JSON.stringify(hiddenToolSeries);
  const hiddenSeriesList = [];
  for (let i = 0; i < count; i++) {
    hiddenSeriesList.push(JSON.parse(templateSeriesStringified));
  }
  return hiddenSeriesList;
}

export const temperatureLabel = getChartLabel(
  "Temp",
  "Temperature",
  toFixedTempCelciusFormatter,
  0,
  45
);

export const humidityLabel = getChartLabel("Humidity", "Humidity", percentageFormatter, 0, 100);

export const pressureLabel = getChartLabel("Pressure", "Pressure", pascalPressureFormatter, 0, 100);

export const iaqLabel = getChartLabel(
  "Indoor Air Quality",
  "IAQ",
  indoorAirQualityFormatter,
  0,
  500
);
