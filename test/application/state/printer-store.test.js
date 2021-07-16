jest.mock("../../../server_src/services/octoprint/octoprint-api.service");
const dbHandler = require("../../db-handler");
const { getSystemChecksDefault } = require("../../../server_src/constants/state.constants");
const { PrintersStore } = require("../../../server_src/state/printers.store");
const { ensureSystemSettingsInitiated } = require("../../../server_src/app-core");

beforeAll(async () => {
  await dbHandler.connect();
  const settings = await ensureSystemSettingsInitiated();
  expect(settings).toEqual("Server settings have been created...");
});

afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("PrinterStore", () => {
  const {
    OctoprintApiService
  } = require("../../../server_src/services/octoprint/octoprint-api.service");
  const { Runner } = require("../../../server_src/state/octofarm.manager");

  const invalidNewPrinter = {
    apikey: "asd",
    websocketURL: null,
    printerURL: null,
    camURL: null
  };

  const weakNewPrinter = {
    apikey: "asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd",
    websocketURL: "http://192.168.1.0:81",
    printerURL: "http://192.168.1.0"
  };

  const weakNewPrinter2 = {
    apikey: "1C0K68VBGAR9VOKAGG1C0K68VBGAR9VOKAGG",
    websocketURL: "http://192.168.1.0:81",
    printerURL: "http://192.168.1.0"
  };

  const validNewPrinter = {
    apikey: "1C0K68VBGAR9VOKAGG1C0K68VBGAR9VOKAGG",
    websocketURL: "ws://asd.com/",
    printerURL: "https://asd.com:81",
    camURL: "http://asd.com:81"
  };

  it("should avoid adding invalid printer", async () => {
    await Runner.init();

    await expect(async () => await PrintersStore.addPrinter({})).rejects.toBeDefined();
    await expect(
      async () => await PrintersStore.addPrinter(invalidNewPrinter)
    ).rejects.toBeDefined();
    await expect(async () => await PrintersStore.addPrinter(weakNewPrinter)).rejects.toBeDefined();
    await expect(async () => await PrintersStore.addPrinter(weakNewPrinter2)).rejects.toBeDefined();
  });

  it("should be able to add printer - receiving an state object back", async () => {
    let frozenObject = await PrintersStore.addPrinter(validNewPrinter);
    expect(Object.isFrozen(frozenObject)).toBeFalsy();

    const flatState = frozenObject.toFlat();
    expect(Object.isFrozen(flatState)).toBeTruthy();

    expect(flatState).toMatchObject({
      id: expect.any(String),
      state: expect.any(String),
      stateColour: expect.any(Object),
      stateDescription: expect.any(String),
      hostState: expect.any(String),
      hostStateColour: expect.any(Object),
      hostDescription: expect.any(String),
      webSocket: expect.any(String),
      webSocketDescription: expect.any(String),
      stepRate: expect.any(Number),
      systemChecks: getSystemChecksDefault(),
      alerts: null
    });
  });
});
