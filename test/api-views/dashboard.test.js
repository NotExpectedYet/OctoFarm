const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { setupTestApp } = require("../../app-test");

let request;

beforeAll(async () => {
  await dbHandler.connect();
  const server = await setupTestApp();

  request = supertest(server);
});

describe("Dashboard rendering", () => {
  it("should show login page by redirect", async () => {
    const res = await request
      .get("/dashboard")
      .send() // We should be redirected to login by default
      .expect(302)
      .then((response) => {
        expect(response.text).toEqual("Found. Redirecting to /users/login");
      });
  });
});
