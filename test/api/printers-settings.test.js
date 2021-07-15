jest.mock("../../server_src/config/auth");

const requestBody = {
  i: "a0a569d20dd308890a1c06"
};

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { setupTestApp } = require("../../app-test");

let request;

beforeAll(async () => {
  await dbHandler.connect();
  const server = await setupTestApp();

  request = supertest(server);
});

describe("Printer Settings Update Endpoint", () => {
  it("should return 400 error when wrong input is provided", async function () {
    const res = await request.post("/printers/updatePrinterSettings").send();

    // Assert input validation failed
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({});
    expect(res.res.statusMessage).toEqual("No ID key was provided");
  }, 10000);

  it("should return 500 if server fails to update printer settings", async function () {
    const res = await request.post("/printers/updatePrinterSettings").send(requestBody);

    // Assert server failed
    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual({});
    expect(res.res.statusMessage).toContain("The server couldn't update your printer settings!");
  }, 10000);
});
