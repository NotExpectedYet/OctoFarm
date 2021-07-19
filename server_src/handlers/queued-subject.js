const { Subject } = require("rxjs");

module.exports = class QueueingSubject extends Subject {
  #queuedValues = [];

  next(value) {
    if (this.closed || this.observed) super.next(value);
    else this.#queuedValues.push(value);
  }

  _subscribe(subscriber) {
    const subscription = super._subscribe(subscriber);

    if (this.#queuedValues.length) {
      this.#queuedValues.forEach((value) => super.next(value));
      this.#queuedValues.splice(0);
    }

    return subscription;
  }
};
