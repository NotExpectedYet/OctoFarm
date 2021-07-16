const dbHandler = require("../../db-handler");
const Alerts = require("../../../server_src/models/Alerts");
const { ScriptRunner } = require("../../../server_src/runners/scriptCheck");

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

describe("scriptCheck", () => {
  it("should save ok", async () => {
    // Model validation for trigger, message and scriptLocation
    await expect(
      async () => await ScriptRunner.save({}, "", "", "")
    ).rejects.toBeTruthy();
    await expect(async () => await ScriptRunner.save({})).rejects.toBeTruthy();

    // TODO Trigger, message and location validation lacking
    await ScriptRunner.save({}, " ", " ", " ");
  });

  it("should edit ok", async () => {
    // Find validation not checked
    const msg = await ScriptRunner.edit({ active: "asd" });
    expect(msg).toBeUndefined();
  });

  it("should check ok", async () => {
    // We have work to do
    await ScriptRunner.check({ active: "asd" }, null, {});
  });

  it("should test ok", async () => {
    // Doesnt report error back
    await ScriptRunner.test({ active: "asd" }, null);
  });

  it("should fire ok", async () => {
    // Doesnt report error back
    await ScriptRunner.fire({ active: "asd" }, null);
  });

  test.skip("should convertMessage ok - .includes error", async () => {
    // Doesnt report error back
    await ScriptRunner.convertMessage({ active: "asd" }, null);
  });

  it("should convertMessage with ok message", async () => {
    // Doesnt report error back
    await ScriptRunner.convertMessage({ active: "asd" }, "null");
    await ScriptRunner.convertMessage(
      { job: "asd", progress: { completion: true } },
      "null"
    );
    await ScriptRunner.convertMessage({ active: "asd" }, "[historyID]");
    await ScriptRunner.convertMessage({ active: "asd" }, "[historyID]", 123);
    await ScriptRunner.convertMessage(
      { progress: { printTimeLeft: 1 } },
      "[ETA]"
    );
    await ScriptRunner.convertMessage(
      { settingsApperance: { name: "asd" } },
      "[PrinterName]"
    );
    await ScriptRunner.convertMessage({ active: "asd" }, "[PrinterURL]");
    await ScriptRunner.convertMessage({ active: "asd" }, "[PrinterAPIKey]");
    await ScriptRunner.convertMessage({ active: "asd" }, "[TimeRemaining]");
    await ScriptRunner.convertMessage({ active: "asd" }, "[EstimatedTime]");
    await ScriptRunner.convertMessage({ active: "asd" }, "[CurrentZ]");
    await ScriptRunner.convertMessage({ active: "asd" }, "[PercentRemaining]");
    await ScriptRunner.convertMessage({ active: "asd" }, "[CurrentTime]");
    await ScriptRunner.convertMessage({ active: "asd" }, "[CurrentFile]");
    await ScriptRunner.convertMessage({ active: "asd" }, "[CurrentFilePath]");
    await ScriptRunner.convertMessage({ active: "asd" }, "[Tool0Temp]");
    await ScriptRunner.convertMessage({ active: "asd" }, "[BedTemp]");
    await ScriptRunner.convertMessage({ active: "asd" }, "[Error!]");
  });

  it("should edit ok - doesnt", async () => {
    const obj = await Alerts.create({
      active: true,
      trigger: "trigger",
      message: "trigger",
      scriptLocation: "trigger",
      printers: []
    });

    // Find validation not checked
    const msg = await ScriptRunner.edit(obj);
    expect(msg).toEqual("saved");
  });
});
