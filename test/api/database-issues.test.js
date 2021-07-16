const supertest = require("supertest");
const { setupExpressServer } = require("../../app-core");
const { setupEnvConfig } = require("../../app-env");
const { serveDatabaseIssueFallbackRoutes } = require("../../app-fallbacks");

let server;

async function setupDatabaseIssueApp() {
  setupEnvConfig(true);

  server = setupExpressServer();
  await serveDatabaseIssueFallbackRoutes(server);
}

jest.mock("../../server_src/services/github-client.service");

describe("DatabaseIssue server", () => {
  it("should return database issue page when no database is connected", async () => {
    app = await setupDatabaseIssueApp();

    const res = await supertest(server).get("/").send();
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain(
      "Docker mode:\n" +
        '                    <span class="badge badge-dark">false</span>'
    );
    expect(res.text).toContain(
      'const defaultMongoDBString = "mongodb://127.0.0.1:27017/octofarm";'
    );
  }, 15000);
});
