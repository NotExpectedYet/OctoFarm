const rootPath = "../../../";
const testPath = "../../";
const dbHandler = require(testPath + "db-handler");
jest.mock(rootPath + "server_src/services/octoprint/octoprint-api.service");
const { ensureSystemSettingsInitiated } = require(rootPath + "app-core");

beforeAll(async () => {
  await dbHandler.connect();
  await ensureSystemSettingsInitiated();
});

afterEach(async () => {
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("OctoPrint-API-Client-Service", () => {
  const { OctoprintApiClientService } = require(rootPath +
    "server_src/services/octoprint/octoprint-api-client.service");

  it("should throw error on any call incorrect printerURL", async () => {
    const instance = new OctoprintApiClientService();

    // TODO Not human-friendly
    expect(
      async () => await instance.get(null, "key", "route", false)
    ).rejects.toHaveProperty("code", "ERR_INVALID_URL");
  });

  it("should throw error on getSettings with incorrect printerURL", async () => {
    const instance = new OctoprintApiClientService();

    // TODO Not human-friendly
    expect(
      async () =>
        await instance.getSettings({
          apikey: "surewhynot",
          printerURL: "some uwrl"
        })
    ).rejects.toHaveProperty("code", "ERR_INVALID_URL");
  });

  it("should not throw error on getSettings with incorrect printerURL", async () => {
    const instance = new OctoprintApiClientService({ apiTimeout: 1 });

    const settings = await instance.getSettings({
      apikey: "surewhynot",
      printerURL: "http://someurl/"
    });
  });
});
