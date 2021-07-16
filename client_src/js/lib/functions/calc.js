// Calculation Functions
export default class Calculate {
  // Generate a random string
  static randomString() {
    const random = Math.random().toString(36).substr(2, 5);
    return random;
  }

  static perc(amount, rounding = 2) {
    return `${amount?.toFixed(rounding) || 0}%`;
  }

  // Apply tofixed if not null
  static toFixed(amount, fractional = 0) {
    return amount?.toFixed(fractional) || 0;
  }

  // Convert miliseconds to Days, Hours, Minutes
  static generateTime(seconds) {
    let string = "";
    if (seconds === undefined || isNaN(seconds) || seconds === null) {
      string = "No Time Estimate";
    } else {
      const days = Math.floor(seconds / (3600 * 24));

      seconds -= days * 3600 * 24;
      const hrs = Math.floor(seconds / 3600);

      seconds -= hrs * 3600;
      const mnts = Math.floor(seconds / 60);

      seconds -= mnts * 60;
      seconds = Math.floor(seconds);

      string = `${days}d, ${hrs}h, ${mnts}m, ${seconds}s`;

      if (mnts === 0) {
        if (string.includes("0m")) {
          string = string.replace(" 0m,", "");
        }
      }
      if (hrs === 0) {
        if (string.includes("0h")) {
          string = string.replace(" 0h,", "");
        }
      }
      if (days === 0) {
        if (string.includes("0d")) {
          string = string.replace("0d,", "");
        }
      }
      if (mnts === 0 && hrs === 0 && days === 0 && seconds === 0) {
        string = string.replace("0s", "Done");
      }
    }

    return string;
  }

  // Check if values are between another value.
  static isBetween(n, a, b) {
    return (n - a) * (n - b) <= 0;
  }

  // TODO EXACT COPY FROM SERVER print-cost.util.js!!
  static returnPrintCost(costSettings, time) {
    if (typeof costSettings === "undefined") {
      // Attempt to update cost settings in history...
      return "No cost settings to calculate from";
    }
    // calculating electricity cost
    const powerConsumption = parseFloat(costSettings.powerConsumption);
    const costOfElectricity = parseFloat(costSettings.electricityCosts);
    const costPerHour = powerConsumption * costOfElectricity;
    const estimatedPrintTime = time / 3600; // h
    const electricityCost = costPerHour * estimatedPrintTime;
    // calculating printer cost
    const purchasePrice = parseFloat(costSettings.purchasePrice);
    const lifespan = parseFloat(costSettings.estimateLifespan);
    const depreciationPerHour = lifespan > 0 ? purchasePrice / lifespan : 0;
    const maintenancePerHour = parseFloat(costSettings.maintenanceCosts);
    const printerCost =
      (depreciationPerHour + maintenancePerHour) * estimatedPrintTime;
    // assembling string
    const estimatedCost = electricityCost + printerCost;
    return estimatedCost.toFixed(2);
  }

  static bytes(a, b) {
    let string = "";
    if (a === undefined || isNaN(a) || a === null) {
      return (string = "No File Estimate");
    }
    if (a == 0) return "0 Bytes";
    const c = 1024;
    const d = b || 2;
    const e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const f = Math.floor(Math.log(a) / Math.log(c));
    return `${parseFloat((a / Math.pow(c, f)).toFixed(d))} ${e[f]}`;
  }

  static dateClean(date) {
    date = new Date(date);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    return `${days[date.getDay()]} ${
      months[date.getMonth()]
    } ${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  }
  static generateCost(cost) {
    if (cost) {
      return cost.toFixed(2);
    } else {
      return 0;
    }
  }
}
