const { FilamentClean } = require("../../../server_src/state/data/filamentClean");

const dbHandler = require("../../db-handler");

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
  await dbHandler.connect();
});

/**
 * Clear all test data after every test.
 */
afterEach(async () => {
  await dbHandler.clearDatabase();
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("filamentClean", function () {
  it("should have default values", () => {
    const spools = FilamentClean.getSpools();
    const profiles = FilamentClean.getProfiles();
    const stats = FilamentClean.getStatistics();
    const selectedFilamentList = FilamentClean.getSelected();
    const dropDownList = FilamentClean.getDropDown();

    expect(spools).toHaveLength(0);
    expect(profiles).toHaveLength(0);
    expect(stats).toHaveLength(0);
    expect(selectedFilamentList).toHaveLength(0);
    expect(dropDownList).toMatchObject({
      normalDropDown: [],
      historyDropDown: []
    });
  });

  it("should be able to construct dropdown list data", async () => {
    expect(FilamentClean.getDropDown()).toMatchObject({
      normalDropDown: [],
      historyDropDown: []
    });

    const result = await FilamentClean.dropDownList([], [], true, []);
    expect(result).toBeUndefined();

    expect(FilamentClean.getDropDown()).toMatchObject({
      normalDropDown: [FilamentClean.noSpoolOptions],
      historyDropDown: [FilamentClean.noSpoolOptions]
    });
  });

  it("should be able to get printer assignment at start", async () => {
    const result = FilamentClean.getPrinterAssignment(null, []);
    expect(result).toEqual([]);
  });

  it("should create stats with minimal input", async () => {
    const result = FilamentClean.createStatistics([], [], []);

    expect(result).toMatchObject({
      materialList: [],
      used: expect.any(Number),
      total: expect.any(Number),
      price: expect.any(Number),
      profileCount: 0,
      spoolCount: 0,
      activeSpools: expect.any(Array),
      activeSpoolCount: expect.any(Number),
      materialBreakDown: []
    });
  });

  it("should be able to start with empty database", async () => {
    await FilamentClean.start();
  });
});
