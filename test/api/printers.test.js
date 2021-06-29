jest.mock("../../server_src/config/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const { Runner } = require("../../server_src/runners/state");
const { setupTestApp } = require("../../app-test");

let request;

beforeAll(async () => {
  await dbHandler.connect();
  const server = await setupTestApp();

  await Runner.init();

  request = supertest(server);
});

describe("Printers", () => {
  // TODO this API endpoint is doing unexpected stuff
  it("should be able to POST printers/add", async () => {
    // TODO bug input validation completely lacking
    const res = await request.post("/printers/add").send([
      {
        settingsAppearance: null,
        apikey: "dafuc",
        tempTriggers: { heatingVariation: null }
      }
    ]);

    expect(res.body.printersAdded).toHaveLength(1);
    expect(res.statusCode).toEqual(200);
  });

  // TODO this API endpoint is doing unexpected stuff, should throw not-found error and not result in 'printersAdded' prop as this is misleading
  it("should be able to POST printers/update", async () => {
    const res = await request.post("/printers/update").send();

    expect(res.body.printersAdded).toHaveLength(0);
    expect(res.statusCode).toEqual(200);
  });

  // TODO this API endpoint is doing unexpected stuff, should throw not-found error
  it("should be able to POST printers/remove", async () => {
    const res = await request.post("/printers/remove").send();

    expect(res.body.printersRemoved).toHaveLength(0);
    expect(res.statusCode).toEqual(200);
  });

  it("should return printer Info list when no Id is provided", async () => {
    const res = await request.post("/printers/printerInfo").send();

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  }, 10000);

  it("should return no printer Info entry when Id is provided but doesnt exist", async () => {
    const res = await request.post("/printers/printerInfo").send({
      i: "asd"
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({});
  }, 10000);
});
