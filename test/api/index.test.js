const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { setupTestApp } = require("../../app-test");

let request;

beforeAll(async () => {
  jest.mock("../../server_src/config/auth");
  await dbHandler.connect();
  const server = await setupTestApp();

  request = supertest(server);
});

describe("Index", () => {
  it("should load welcome page in case of missing authentication", async () => {
    const response = await request.get("/").send();

    expect(response.statusCode).toEqual(200);
    expect(response.headers.location).toBeUndefined();
    // response.url
  });

  it("should load dashboard", async () => {
    const response = await request.get("/dashboard").send();

    expect(response.headers.location).not.toBe("/users/login");
    expect(response.headers.location).toBeUndefined();
    expect(response.statusCode).toEqual(200);
  });
});
