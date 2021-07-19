const dbHandler = require("../db-handler");
const supertest = require("supertest");
const getEndpoints = require("express-list-endpoints");
const { setupTestApp } = require("../../server_src/app-test");

let request;

beforeAll(async () => {
  await dbHandler.connect();
  const server = await setupTestApp();

  expect(getEndpoints(server)).toContainEqual({
    methods: ["GET", "POST"],
    middleware: ["anonymous"],
    path: "/users/login"
  });
  request = supertest(server);
});

describe("Users", () => {
  const usersBase = "/users";
  const loginRoute = usersBase + "/login";
  const registerRoute = usersBase + "/register";
  const logoutRoute = usersBase + "/logout";

  it("should load login page", async () => {
    const response = await request.get(loginRoute).send();
    expect(response.statusCode).toEqual(200);
    // Apparently the location header is not set initially for non-redirect pages
    expect(response.headers.location).toBeUndefined();
  });

  it("should be able to load logout with redirect to login", async () => {
    const response = await request.get(logoutRoute).send();
    expect(response.statusCode).toEqual(302);
    expect(response.headers.location).toEqual(loginRoute);
  });

  it("should be able to load registration", async () => {
    const response = await request.get(registerRoute).send();
    expect(response.statusCode).toEqual(200);
    expect(response.headers.location).toBeUndefined();
  });
});
