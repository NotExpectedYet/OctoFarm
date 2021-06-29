const express = require("express");
const supertest = require("supertest");
const dbHandler = require("../../../../../test/db-handler");
const { getPluginState } = require("../../../plugin-state");
const { configurePlugins } = require("../../../plugin-manager");
const { scanPlugins } = require("../../../plugin-manager");

let request;
let server;

beforeAll(async () => {
  await dbHandler.connect();
  server = express();

  request = supertest(server);
});

describe("Plugins:oidc-auth", () => {
  function getServerUrl() {
    expect(server).not.toBeUndefined();
    return request.get("").url;
  }

  function getReferenceOpenIDConfiguration(knownHost) {
    const configConstructor = require("./mock-data/well-known-openid-configuration.template");

    return configConstructor(knownHost);
  }

  // Our own implementation in case we dont want mongo, nor default in-memory
  process.env.OIDC_MEMORY = "true";
  process.env.OIDC_CLIENT_ID = "justanidea";
  process.env.OIDC_CLIENT_SECRET = "justasecret";

  // Semi-volatile route, so keep it in 1 place here
  const testGuardedRoute = "/octoprint/announce";

  it("should be able to fully configure plugin", async () => {
    await scanPlugins();
    const host = getServerUrl();

    await configurePlugins(server, host);

    const pluginState = getPluginState();
    expect(pluginState.scannedPlugins).toHaveLength(1);
    expect(pluginState.scannedPlugins[0].name).toEqual("octoprint-companion");

    const res = await request.post("/oidc/token").send();
    expect(res.status).toEqual(400);
  });

  it("should be able to fully configure plugin - detecting the well-known oidc configuration", async () => {
    await scanPlugins();
    const host = getServerUrl();

    await configurePlugins(server, host);

    const res = await request
      .get("/oidc/.well-known/openid-configuration")
      .send();
    expect(res.status).toEqual(200);
    expect(res.body).toEqual(getReferenceOpenIDConfiguration(host));
  });

  it("should be able to fully configure plugin - announcing and announcements api functionality", async () => {
    await scanPlugins();
    const host = getServerUrl();

    await configurePlugins(server, host);

    const pluginState = getPluginState();
    expect(pluginState.scannedPlugins).toHaveLength(1);
    expect(pluginState.scannedPlugins[0].name).toEqual("octoprint-companion");

    await request
      .post(testGuardedRoute)
      .expect("Content-Type", /json/)
      .expect(401)
      .expect(function (res) {
        expect(res.body).toMatchObject({
          error: "Unauthorized",
          error_description: "authorization header missing"
        });
      });
    await request
      .post(testGuardedRoute)
      .set("Authorization", "abc123")
      .expect("Content-Type", /json/)
      .expect(401)
      .expect(function (res) {
        expect(res.body).toMatchObject({
          error: "Unauthorized",
          error_description: "authorization not prefixed with 'Bearer' scheme"
        });
      });
    await request
      .post(testGuardedRoute)
      .set("Authorization", "Bearer abc123")
      .expect("Content-Type", /json/)
      .expect(401)
      .expect(function (res) {
        expect(res.body).toMatchObject({
          error: "Unauthorized",
          error_description: "bearer token is not length 43"
        });
      });
    await request
      .post(testGuardedRoute)
      .set(
        "Authorization",
        "Bearer 4du5g5UQoh4z7OEwf21jhguZspNNMOpHfPfD5wQ7gGL"
      )
      .expect("Content-Type", /json/)
      .expect(401)
      .expect(function (res) {
        expect(res.body).toMatchObject({
          error: "Unauthorized",
          error_description: "bearer token is not valid"
        });
      });
  });
});
