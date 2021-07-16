const dbHandler = require("../db-handler");

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
  await dbHandler.connect();
});

/**
 * Clear all test data after every test.
 */
afterEach(async () => {
  await dbHandler.clearDatabase();
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("DownloadUtil", () => {
  const errorOnDownload = "Download was rejected";
  jest.mock(
    "node-fetch",
    () => () =>
      Promise.resolve({
        body: {
          pipe: () => null,
          on: (type, reject) => reject(errorOnDownload)
        }
      })
  );
  jest.mock("fs", () => {
    return {
      createWriteStream: () => {
        return {
          on: (type, cb) => cb()
        };
      },
      existsSync: () => true,
      stat: () => true
    };
  });

  it("should be able to catch download errors (mocked)", async () => {
    const {
      downloadFromOctoPrint
    } = require("../../server_src/utils/download.util");

    const testPath = "test.file";
    const testUrl = "totally.illegal test.url";
    const callback = () => {};
    const apikey = "allen key";

    let wasCaught = false;

    await expect(
      async () =>
        await downloadFromOctoPrint(testUrl, testPath, callback, apikey)
          .then(() => {
            // This is a test to make sure we dont hit this point.
            expect(true).toBe(false);
          })
          .catch((e) => {
            expect(e).toEqual(errorOnDownload);
            wasCaught = true;
          })
    ).not.toThrow();
  });
});
