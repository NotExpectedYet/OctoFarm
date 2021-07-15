const noCostSettingsMessage = "No cost settings to calculate from";

/**
 * Calculate the cost of printing
 * @param printTime
 * @param costSettings
 * @returns {number|null}
 */
function getPrintCostNumeric(printTime, costSettings) {
  if (!costSettings) {
    // Attempt to update cost settings in history...
    return null;
  }
  // calculating electricity cost
  const powerConsumption = parseFloat(costSettings.powerConsumption);
  const costOfElectricity = parseFloat(costSettings.electricityCosts);
  const costPerHour = powerConsumption * costOfElectricity;
  const estimatedPrintTime = printTime / 3600; // h
  const electricityCost = costPerHour * estimatedPrintTime;

  // calculating printer cost
  const purchasePrice = parseFloat(costSettings.purchasePrice);
  const lifespan = parseFloat(costSettings.estimateLifespan);
  const depreciationPerHour = lifespan > 0 ? purchasePrice / lifespan : 0;
  const maintenancePerHour = parseFloat(costSettings.maintenanceCosts);
  const printerCost = (depreciationPerHour + maintenancePerHour) * estimatedPrintTime;
  // assembling string
  return electricityCost + printerCost;
}

module.exports = {
  noCostSettingsMessage,
  getPrintCostNumeric
};
