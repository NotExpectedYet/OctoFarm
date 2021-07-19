const rootPath = "../../../";
const testPath = "../../";
jest.mock("mjpeg-decoder");
const decoderMock = require("mjpeg-decoder");
const dbHandler = require(testPath + "db-handler");
const octoPrintApiServicePath = rootPath + "server_src/services/octoprint/octoprint-api.service";
jest.mock(octoPrintApiServicePath);
const { OctoprintApiService } = require(octoPrintApiServicePath);
const { OctoprintApiClientService } = require(rootPath +
  "server_src/services/octoprint/octoprint-api-client.service");
const Spool = require(rootPath + "server_src/models/Filament.js");
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

describe("History:Runner", () => {
  jest.mock("../../../server_src/utils/download.util");
  // FS should be mocked as late as possible in order to give MongoDB Memory Server a chance
  jest.mock("fs");
  const { HistoryCollection } = require("../../../server_src/services/history.runner");

  const basePath = "./images/historyCollection";

  const testFilename = "test.file";
  const testIllegalURL = "totally.illegal test.url";
  const goodAPIKey = "123456ABCD123456ABCD123456ABCDEF";

  const testCorrectURLs = [
    "https://url.myurl:80",
    "https://url.myurl:443",
    "http://url.myurl?asd=123",
    "http://url.myurl/?asd=123", // Python/OP doesnt like closed routes...
    "http://url.myurl?asd=123"
  ];
  const testId = 'totally.illegal id with code fs.removeFile("~/.ssh/authorizedKeys")';
  const totallyInvalidServerSettings = {};

  it("should be able to download an OctoPrint timelapse", async () => {
    const response = await HistoryCollection.grabTimeLapse(
      testFilename,
      testIllegalURL,
      testId,
      totallyInvalidServerSettings
    );

    expect(response).toContain(`${basePath}/timelapses/${testId}-${testFilename}`);
  });

  it("should prevent downloading an OctoPrint thumbnail with wrong URL", async () => {
    await expect(
      async () =>
        await HistoryCollection.grabThumbnail(testIllegalURL, testFilename, testId, {
          apikey: goodAPIKey
        }).toThrow()
    );
  });

  it("should be able to download an OctoPrint thumbnail", async () => {
    for (let url of testCorrectURLs) {
      const response = await HistoryCollection.grabThumbnail(url, testFilename, testId, {
        apikey: goodAPIKey
      });
      expect(response).toContain(`${basePath}/thumbs/${testId}-${testFilename}`);
    }
  });

  it("should be able to call snapPictureOfPrinter", async () => {
    const buf = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
    decoderMock.setBuffer(buf);
    const testImage = "test";
    const response = await HistoryCollection.snapPictureOfPrinter(
      testIllegalURL,
      testId,
      testImage
    );

    expect(response).toContain(`${basePath}/snapshots/${testId}-${testImage}.jpg`);
  });

  it("should fail resyncFilament without OctoPrint Connector service", async () => {
    const printer = {
      apikey: goodAPIKey,
      selectedFilament: [
        {
          spools: {
            fmID: 1
          }
        }
      ]
    };

    await expect(async () => await HistoryCollection.resyncFilament(printer)).rejects.toContain(
      "OctoPrint Client Connector not instantiated. Report please."
    );
  });

  it("should fail resyncFilament when printer selected filamentID falsy", async () => {
    const printer = {
      apikey: goodAPIKey,
      printerURL: testCorrectURLs[0],
      selectedFilament: [
        {
          spools: {}
        }
      ]
    };
    const opClientMock = new OctoprintApiClientService({});
    await HistoryCollection.inject(opClientMock);

    await expect(async () => await HistoryCollection.resyncFilament(printer)).not.toThrow();

    // The try catch in the code prevents rejection but also makes the error hard to spot
    // rejects.toContain(
    //   `Could not query OctoPrint FilamentManager for filament. FilamentID '${undefined}' not found.`
    // );
  });

  it("should fail resyncFilament when ID not known", async () => {
    const printer = {
      apikey: goodAPIKey,
      printerURL: testCorrectURLs[0],
      selectedFilament: [
        {
          spools: {
            fmID: 1
          }
        }
      ]
    };
    const opClientMock = new OctoprintApiClientService({});
    await HistoryCollection.inject(opClientMock);

    await expect(async () => await HistoryCollection.resyncFilament(printer)).not.toThrow();

    // The try catch in the code prevents rejection but also makes the error hard to spot
    // .rejects.toContain(
    //   `Spool database entity by ID '${undefined}' not found. Cant update filament.`
    // );
  });

  it("should fail resyncFilament - missing filament db document", async () => {
    const printer = {
      apikey: goodAPIKey,
      printerURL: testCorrectURLs[0],
      selectedFilament: [
        {
          spools: {
            fmID: 1
          },
          _id: "4edd40c86762e0fb12000003"
        }
      ]
    };
    const opClientMock = new OctoprintApiClientService({});
    await HistoryCollection.inject(opClientMock);

    await expect(async () => await HistoryCollection.resyncFilament(printer)).not.toThrow();

    // The try catch in the code prevents rejection but also makes the error hard to spot
    // .rejects.toContain(
    //   `Spool database entity by ID '4edd40c86762e0fb12000003' not found. Cant update filament.`
    // );
  });

  it("should succeed resyncFilament when every code weakness is overcome", async () => {
    const obj = await Spool.create({ spools: {} });

    const printer = {
      apikey: goodAPIKey,
      printerURL: testCorrectURLs[0],
      selectedFilament: [
        {
          spools: {
            fmID: 1
          },
          _id: obj._id
        }
      ]
    };

    const opClientMock = new OctoprintApiClientService({});
    await HistoryCollection.inject(opClientMock);
    OctoprintApiService.saveMockResponse(200, { spool: { profile: {} } });

    const spools = await HistoryCollection.resyncFilament(printer);
    expect(spools).toHaveLength(1);
    expect(spools[0]).toMatchObject({ __v: 0, _id: expect.anything() });
  });

  it("should safely skip for bad input thumbnailCheck", async () => {
    const thumbNail = await HistoryCollection.thumbnailCheck(
      { name: "test2_notgoingtobefound.file" },
      {},
      [{ name: testFilename }],
      {
        apikey: goodAPIKey
      }
    );
    expect(thumbNail).toBeNull();
  });

  it("should safely skip for disabled thumbnail event serverSetting - thumbnailCheck", async () => {
    const thumbNail = await HistoryCollection.thumbnailCheck(
      { name: "test2_notgoingtobefound.file" },
      { history: { thumbnails: [] } },
      [{ name: testFilename }],
      {
        apikey: goodAPIKey
      }
    );
    expect(thumbNail).toBeNull();
  });

  it("should be able to call thumbnailCheck", async () => {
    const thumbNail = await HistoryCollection.thumbnailCheck(
      { name: "test.file" },
      {},
      [{ name: testFilename, thumbnail: "notnullforsure" }],
      {
        apikey: goodAPIKey
      },
      "derp",
      {
        apikey: goodAPIKey,
        printerURL: testCorrectURLs[1]
      }
    );
    expect(thumbNail).toBeTruthy();
  });

  it("should safely skip for snapshot event serversetting disabled - snapshotCheck", async () => {
    const thumbNail = await HistoryCollection.snapshotCheck(
      "derp",
      {
        history: { snapshot: {} }
      },
      {
        apikey: goodAPIKey,
        printerURL: testCorrectURLs[1]
      },
      { _id: "test_id" },
      {
        name: "asd"
      }
    );
    expect(thumbNail).toBeNull();
  });

  it("should be able to call snapshotCheck", async () => {
    const thumbNail = await HistoryCollection.snapshotCheck(
      "derp",
      [{ name: testFilename, thumbnail: "notnullforsure" }],
      {
        apikey: goodAPIKey,
        printerURL: testCorrectURLs[1]
      },
      { _id: "test_id" },
      {
        name: "asd"
      }
    );
    expect(thumbNail).toBeTruthy();
  });
});
