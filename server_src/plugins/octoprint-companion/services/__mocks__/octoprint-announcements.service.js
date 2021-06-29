const octoprintAnnouncements = jest.createMockFromModule(
  "../octoprint-announcements.service"
);
const realModule = jest.requireActual("../octoprint-announcements.service");

let testAnnouncements = [];

octoprintAnnouncements.findAnnouncedDevice = async (
  deviceUuid,
  persistenceUuid
) => {
  if (!deviceUuid || !persistenceUuid) {
    return false;
  }

  return testAnnouncements.find(
    (a) => a.deviceUuid === deviceUuid && a.persistenceUuid === persistenceUuid
  );
};

octoprintAnnouncements.list = async (onlyNotRegistered = true) => {
  return testAnnouncements.filter((a) =>
    onlyNotRegistered ? a.isRegistered === false : true
  );
};

octoprintAnnouncements.create = (inputData) => {
  testAnnouncements.push(inputData);

  return inputData;
};

octoprintAnnouncements.resetMockData = () => {
  testAnnouncements = [];
};

module.exports = octoprintAnnouncements;
