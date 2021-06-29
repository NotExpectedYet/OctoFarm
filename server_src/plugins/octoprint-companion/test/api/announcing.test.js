jest.mock("../../middleware/local-client.strategy");
const supertest = require("supertest");
const dbHandler = require("../../../../../test/db-handler");
const express = require("express");
const {
  findAnnouncedDevice
} = require("../../services/octoprint-announcements.service");
const { getPluginState } = require("../../../plugin-state");
const { configurePlugins } = require("../../../plugin-manager");
const { scanPlugins } = require("../../../plugin-manager");

let request;
let server;

function getServerUrl() {
  expect(server).not.toBeUndefined();
  return request.get("").url;
}

beforeAll(async () => {
  // Our own implementation in case we dont want mongo, nor default in-memory
  process.env.OIDC_MEMORY = "true";
  process.env.OIDC_CLIENT_ID = "justanidea";
  process.env.OIDC_CLIENT_SECRET = "justasecret";

  await dbHandler.connect();
  server = express();
  server.use(express.json());

  request = supertest(server);

  await scanPlugins();
  const host = getServerUrl();

  await configurePlugins(server, host);

  const pluginState = getPluginState();
  expect(pluginState.scannedPlugins).toHaveLength(1);
  expect(pluginState.scannedPlugins[0].name).toEqual("octoprint-companion");
  expect(pluginState.failedToConfigurePlugins).toHaveLength(0);
  expect(pluginState.configuredPlugins).toHaveLength(1);
});

describe("Plugins:oidc-auth", () => {
  function announce(code, body) {
    return (
      request
        .post("/octoprint/announce")
        .send(body)
        // .expect("Content-Type", /json/)
        .expect(code)
    );
  }

  const inputProps = [
    "persistenceUuid",
    "deviceUuid",
    "port",
    "allowCrossOrigin",
    "docker"
  ];

  it("should fail announcing for invalid inputs", async () => {
    await announce(422, undefined).expect(function (res) {
      expect(Object.keys(res.body)).toEqual(expect.arrayContaining(inputProps));
    });

    await announce(422, {
      persistenceUuid: "test",
      deviceUuid: "test",
      port: "test",
      allowCrossOrigin: "test",
      docker: "test"
    }).expect(function (res) {
      expect(res.body).toMatchObject({
        port: { message: "The port must be a number.", rule: "numeric" },
        docker: {
          message: "The docker field must be boolean.",
          rule: "boolean"
        },
        allowCrossOrigin: {
          message: "The allow cross origin field must be boolean.",
          rule: "boolean"
        }
      });
    });
  });

  it("should succeeed announcing for right input shape", async () => {
    const deviceid = "test123123123UNIIIIIQUE";
    await announce(200, {
      persistenceUuid: "test",
      deviceUuid: deviceid,
      port: 4000,
      allowCrossOrigin: false,
      docker: false
    }).expect(async (res) => {
      expect(res.body).toMatchObject({
        alive: true,
        dateAdded: expect.any(Number),
        deviceUrl: "http://::ffff:127.0.0.1:4000"
      });

      const deviceAnnouncement = await findAnnouncedDevice(deviceid, "test");
      expect(deviceAnnouncement).not.toEqual(false);
      expect(deviceAnnouncement).toMatchObject({
        persistenceUuid: "test",
        deviceUuid: deviceid
      });
    });
  });
});
