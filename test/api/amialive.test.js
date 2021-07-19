const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { setupTestApp } = require("../../server_src/app-test");
const isDocker = require("is-docker");
const { AppConstants } = require("../../server_src/app.constants");

let request;

beforeAll(async () => {
  await dbHandler.connect();
  const server = await setupTestApp();

  request = supertest(server);
});

jest.mock("../../server_src/services/github-client.service");
const softwareUpdateChecker = require("../../server_src/services/octofarm-update.service");

describe("AmIAlive Endpoint", () => {
  it("should return ok and no update", async () => {
    process.env[AppConstants.VERSION_KEY] = require("../../package.json").version;
    process.env.testlatest_package_version = require("../../package.json").version;

    await softwareUpdateChecker.syncLatestOctoFarmRelease();

    const res = await request.get("/serverchecks/amialive").send();
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("ok");
    expect(res.body.isDockerContainer).toEqual(isDocker());
    expect(res.body.isPm2).toEqual(false);
    expect(res.body).toHaveProperty("update");
    expect(res.body.update.installed_release_found).toEqual(true);
    expect(res.body.update.update_available).toEqual(false);
  }, 15000);

  it("should look for octofarm update", async () => {
    // Ensure that the update sync has completed by explicit call
    process.env.testlatest_package_version = "0.0.0-TEST";
    process.env[AppConstants.VERSION_KEY] = "1.1.1-TEST";
    await softwareUpdateChecker.syncLatestOctoFarmRelease();

    // Perform API action
    const res = await request.get("/serverchecks/amialive").send();

    // Assert response
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("update");
    expect(res.body.isDockerContainer).toEqual(isDocker());
    expect(res.body.isPm2).toEqual(false);
    expect(res.body.update.update_available).toEqual(false);
    expect(res.body.update.installed_release_found).toEqual(false);
  }, 15000);

  it("should tolerate undefined package version", async () => {
    // Ensure that the update sync has completed by explicit call
    process.env.testlatest_package_version = "0.0.0-TEST";
    process.env[AppConstants.VERSION_KEY] = undefined;

    await softwareUpdateChecker.syncLatestOctoFarmRelease();

    // Perform API action
    const res = await request.get("/serverchecks/amialive").send();

    // Assert response
    expect(res.body.update.installed_release_found).toEqual(false);
    expect(res.body.update.update_available).toEqual(false);
  }, 15000);

  it("should tolerate being air-gapped silently", async () => {
    process.env.test_airgapped = true;
    process.env[AppConstants.VERSION_KEY] = undefined;

    await softwareUpdateChecker.syncLatestOctoFarmRelease();

    // Perform API action
    const res = await request.get("/serverchecks/amialive").send();

    // Assert response
    expect(res.body.update.update_available).toEqual(false);

    delete process.env.test_airgapped;
  });
});
