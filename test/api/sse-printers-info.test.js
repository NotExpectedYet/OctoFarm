jest.mock("../../server_src/config/auth");

const EventSource = require('eventsource');
const dbHandler = require("../db-handler");
const supertest = require("supertest");
const getEndpoints = require("express-list-endpoints");
const { setupTestApp } = require("../../app-test");

let request;
const routeBase = "/printersInfo/";
const ssePath = "get/";

beforeAll(async () => {
  await dbHandler.connect();
  const server = await setupTestApp();

  const endpoints = getEndpoints(server);
  expect(endpoints).toContainEqual({
    methods: ["GET"],
    middleware: ["anonymous", "anonymous"],
    path: routeBase + ssePath
  });
  request = supertest(server);
});

describe("SSE-printersInfo", () => {

  it("should be able to be called with an EventSource", async (done) => {
    const getRequest = request.get(routeBase + ssePath);
    const url = getRequest.url;
    expect(url).toBeTruthy();

    const es = new EventSource(url);

    // events.emit('test', 'test message')
    es.onmessage = e => {
      expect(e.data).toEqual("[{\"printersInformation\":\"1\",\"printerControlList\":\"2\",\"currentTickerList\":\"3\"},[],[],[]]");
      es.close()
      done();
    }
  }, 10000);
});