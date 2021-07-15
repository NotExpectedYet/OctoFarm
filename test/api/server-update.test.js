const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { setupTestApp } = require("../../app-test");

let request;

beforeAll(async () => {
  await dbHandler.connect();
  const server = await setupTestApp();

  request = supertest(server);
});

describe("ServerUpdate Endpoint", () => {
  it("should return 302 redirect when no user is logged in", async function () {
    process.env.npm_package_version = require("../../package.json").version;
    process.env.testlatest_package_version = require("../../package.json").version;

    const res = await request.post("/settings/server/update/octofarm").send();
    expect(res.statusCode).toEqual(302);
  }, 10000);
});
