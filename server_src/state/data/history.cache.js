const { HistoryClean } = require("./historyClean");

class HistoryCache {
  #historyCleanState;

  constructor({}) {
    this.#historyCleanState = new HistoryClean();
  }

  getHistoryCache() {
    return this.#historyCleanState;
  }

  async initHistoryCache() {
    if (!!this.#historyCleanState) {
      await this.#historyCleanState.initCache();
    } else {
      // Will never occur.
      throw new Error("Cant init unconstructed historyCache.");
    }
  }
}

module.exports = HistoryCache;
