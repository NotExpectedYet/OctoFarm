const {
  getPrintCostNumeric,
  noCostSettingsMessage
} = require("../../../server_src/utils/print-cost.util");

const defaultCostSettings = {
  powerConsumption: 0.05,
  electricityCosts: 0.12,
  purchasePrice: 7.5,
  estimateLifespan: 3,
  maintenanceCosts: 3
};
const examplePrintTime = 30;

describe("printCostUtil", function () {
  it("should return known message when costSetting is undefined", async function () {
    expect(getPrintCostNumeric(1, undefined)).toBe(null);
  });
  it("should return known message when costSetting is null", async function () {
    expect(getPrintCostNumeric(1, null)).toBe(null);
  });

  it('should return cost estimation "NaN" when powerConsumption is not in costSettings', async function () {
    expect(getPrintCostNumeric(1, {})).toBe(NaN);
  });

  it("should return cost estimation when providing known printTime and costSettings", async function () {
    expect(getPrintCostNumeric(examplePrintTime, defaultCostSettings)).toBe(0.04588333333333333);
  });

  it('should return string "0.00" when printTime is 0', async function () {
    expect(getPrintCostNumeric(0, defaultCostSettings)).toBe(0);
  });

  it('should return string "0.03" when estimateLifespan is falsy', async function () {
    const costSettings = {
      ...defaultCostSettings,
      estimateLifespan: null
    };
    expect(getPrintCostNumeric(examplePrintTime, costSettings)).toBe(0.025050000000000003);
  });

  it('should return string "0.03" when estimateLifespan is zero', async function () {
    const costSettings = {
      ...defaultCostSettings,
      estimateLifespan: "0.00"
    };
    expect(getPrintCostNumeric(examplePrintTime, costSettings)).toBe(0.025050000000000003);
  });

  it('should tolerate illegal value estimateLifespan and return string "0.04"', async function () {
    const costSettings = {
      ...defaultCostSettings,
      estimateLifespan: "5.a5"
    };
    expect(getPrintCostNumeric(examplePrintTime, costSettings)).toBe(0.03755);
  });
});
