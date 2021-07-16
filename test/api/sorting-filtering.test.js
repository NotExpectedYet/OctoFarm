jest.mock("../../server_src/config/auth");

const dbHandler = require("../db-handler");
const supertest = require("supertest");
const getEndpoints = require("express-list-endpoints");
const {
  defaultFilterBy,
  defaultSortBy
} = require("../../server_src/lib/providers/filter-sorting.constants");
const { getSorting } = require("../../server_src/lib/sorting");
const { getFilter } = require("../../server_src/lib/sorting");
const { setupTestApp } = require("../../app-test");

let request;

beforeAll(async () => {
  await dbHandler.connect();
  const server = await setupTestApp();

  const endpoints = getEndpoints(server);
  expect(endpoints).toContainEqual({
    methods: ["GET"],
    middleware: ["anonymous", "anonymous"],
    path: "/client/updateFilter/:filter"
  });
  expect(endpoints).toContainEqual({
    methods: ["GET"],
    middleware: ["anonymous", "anonymous"],
    path: "/client/updateSorting/:sorting"
  });
  request = supertest(server);
});

const routeBase = "/client";

describe("Filter", () => {
  const updateFilterGetRoute = routeBase + "/updateFilter/filterstring";

  it("should default to defaultFilterBy constant", async () => {
    const filtering = getFilter();
    expect(filtering).toEqual(defaultFilterBy);
  });

  // TODO this test shows that this API endpoint is weakly constrained
  it("should be able to update filter with route child as param", async () => {
    const response = await request.get(updateFilterGetRoute).send();
    expect(response.statusCode).toEqual(200);

    const filtering = getFilter();
    expect(filtering).toEqual("filterstring");
  });
});

describe("Sorting", () => {
  const updateSortingGetRoute = routeBase + "/updateSorting/sortingstring";

  it("should default to defaultFilterBy constant", async () => {
    const filtering = getSorting();
    expect(filtering).toEqual(defaultSortBy);
  });

  // TODO this test shows that this API endpoint is weakly constrained
  it("should be able to update sorting with route child as param", async () => {
    const response = await request.get(updateSortingGetRoute).send();
    expect(response.statusCode).toEqual(200);

    const sorting = getSorting();
    expect(sorting).toEqual("sortingstring");
  });
});
