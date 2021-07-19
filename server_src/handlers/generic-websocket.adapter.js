/**
 * An OctoFarm websocket handler suitable for any websocket application like OctoPrint, Mariner, Klipper, etc.
 * Copy it to fit your needs, or take a look at 'octoprint-websocket.adapter.js'
 */
module.exports = class GenericWebsocketAdapter {
  #id;
  #webSocketURL;

  // Add your metadata in your extension
  // #currentUser;
  // #sessionKey;
  // #throttle;

  // The adapter instance is saved here create your own private version
  // #client;

  constructor({ id, webSocketURL /*, currentUser, sessionkey, throttle */ }) {
    this.#id = id.toString();
    this.#webSocketURL = new URL(webSocketURL).href;

    // Add your own properties when extending
    // this.#currentUser = currentUser;
    // this.#sessionKey = sessionkey;
    // this.#throttle = throttle;

    // this.#constructClient();
  }

  #constructClient() {
    // Construct your specific client here... f.e.
    // this.#client = new HexNutClient({ followRedirects: true }, ws);
    // or
    // this.#client = new WebSocket({ followRedirects: true });
  }

  get _id() {
    return this.#id;
  }

  set websocketURL(url) {
    this.#webSocketURL = new URL(url).href;
  }

  get websocketURL() {
    return this.#webSocketURL;
  }

  /**
   * Optional function to override the starting call for the websocket adapter
   */
  start() {
    // Add your starting call to bind handlers and connect to your transport
  }

  /**
   * @abstract Make sure to override the closing call for the websocket adapter
   * Note: dont perform heavy or slow code in this
   */
  close() {
    // Cleanup and send any terminating messages, or rapidly save state
  }
};
