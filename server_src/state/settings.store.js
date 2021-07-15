class SettingsStore {
  #server;
  #client;

  #clientSettingsService;
  #serverSettingsService;

  constructor({ clientSettingsService, serverSettingsService }) {
    this.#clientSettingsService = clientSettingsService;
    this.#serverSettingsService = serverSettingsService;
  }

  async loadSettings() {
    // Setup Settings as connection is established
    this.#server = await this.#serverSettingsService.getOrCreate();
    this.#client = await this.#clientSettingsService.getOrCreate();
  }

  getServerSettings() {
    return Object.freeze({
      ...this.#server._doc
    });
  }

  getClientSettings() {
    return Object.freeze({
      ...this.#client._doc
    });
  }

  isFilamentEnabled() {
    return this.#server.filamentManager;
  }
}

module.exports = SettingsStore;
