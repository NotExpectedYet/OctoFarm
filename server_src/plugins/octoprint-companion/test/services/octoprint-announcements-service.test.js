const dbHandler = require("../../../../../test/db-handler");

beforeAll(async () => {
  await dbHandler.connect();
});

describe("Plugins:auto-registration", () => {
  jest.mock("../../services/octoprint-announcements.service");
  const service = require("../../services/octoprint-announcements.service");

  it("should be able to find a known announced printer by uuid's", async () => {
    await service.create({
      isRegistered: true,
      deviceUuid: "known",
      persistenceUuid: "idontsurvivebackup"
    });

    const announcement = await service.findAnnouncedDevice(
      "known",
      "idontsurvivebackup"
    );

    expect(announcement).toEqual({
      isRegistered: true,
      deviceUuid: "known",
      persistenceUuid: "idontsurvivebackup"
    });
  });
});
