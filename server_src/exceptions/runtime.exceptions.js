class NotImplementedException extends Error {
  constructor(message) {
    super(message);
    this.name = "NotImplementedException";
  }
}

class NotFoundException extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundException";
  }
}

module.exports = {
  NotImplementedException,
  NotFoundException
};
