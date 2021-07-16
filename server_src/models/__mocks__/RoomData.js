const roomDataModel = jest.createMockFromModule("../RoomData");

let roomData = [];

roomDataModel.find = () => {
  return {
    sort: () => {
      return {
        limit: () => {
          return {
            exec: (cb) => {
              return cb(undefined, roomData);
            }
          };
        }
      };
    }
  };
};
roomDataModel.create = async (entry) => roomData.push(entry);
roomDataModel.reset = async () => (roomData = []);

module.exports = roomDataModel;
