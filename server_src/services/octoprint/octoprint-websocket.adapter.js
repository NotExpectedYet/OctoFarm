const HexNutClient = require("hexnut-client");
const handle = require("hexnut-handle");
const ws = require("ws");
const GenericWebsocketAdapter = require("../../handlers/generic-websocket.adapter");
const { OP_WS_MSG, OP_WS_SKIP } = require("./constants/websocket.constants");
const {
  octoprintParseMiddleware,
  skipAnyHeaderInMiddleware,
  matchHeaderMiddleware
} = require("./utils/websocket.utils");

class OctoPrintWebSocketAdapter extends GenericWebsocketAdapter {
  // Provided by base class
  // #id;
  // #webSocketURL;

  // Our OctoPrint data
  #currentUser;
  #sessionKey;
  #throttle;

  #client;

  constructor({ id, webSocketURL, currentUser, sessionkey, throttle }) {
    super({ id: id.toString(), webSocketURL });

    this.#currentUser = currentUser;
    this.#sessionKey = sessionkey;
    this.#throttle = throttle;

    this.#constructClient();
  }

  #constructClient() {
    this.#client = new HexNutClient({ followRedirects: true }, ws);
  }

  /**
   * @override This implements the opening/connecting action of our base class
   */
  start() {
    this.#client.use(
      handle.connect((ctx) => {
        const data = { auth: `${this.#currentUser}:${this.#sessionKey}` };
        ctx.send(JSON.stringify(data));

        if (this.#throttle) {
          const throtleSettings = { throttle: this.#throttle };
          ctx.send(throtleSettings);
        }
      })
    );
    this.#client.use(
      handle.closing((ctx) => {
        console.log("WS closing");
      })
    );
    this.#client.onerror += (e, ctx) => {
      console.log("ws error");
    };
    this.#client.use(octoprintParseMiddleware);
    this.#client.use(skipAnyHeaderInMiddleware(OP_WS_SKIP));
    this.#client.use(matchHeaderMiddleware(OP_WS_MSG.connected, this.#onConnection));
    this.#client.use(matchHeaderMiddleware(OP_WS_MSG.current, this.#handleCurrentMessage));
    this.#client.use(matchHeaderMiddleware(OP_WS_MSG.history, this.#handleHistoryMessage));
    this.#client.use(matchHeaderMiddleware(OP_WS_MSG.timelapse, this.#handleTimelapseMessage));
    this.#client.use(matchHeaderMiddleware(OP_WS_MSG.event, this.#handleEventMessage));

    this.#client.use((ctx) => {
      console.log(`OP Message received '${ctx.message.header}'`);
    });

    this.#client.connect(`${this.websocketURL}/sockjs/websocket`);
  }

  /**
   * @override This implements the closing/disposing action of our base class
   */
  close() {
    this.#client.close();
  }

  #onConnection(ctx) {
    console.log(`OP connected successfully '${ctx.message.header}'`);
  }

  #handleCurrentMessage(ctx) {
    // console.log(`Received current event '${ctx.message.header}'`);
  }

  #handleHistoryMessage(ctx) {
    // console.log(`Received history event '${ctx.message.header}'`);
  }

  #handleTimelapseMessage(ctx) {
    // console.log(`Received timelapse event '${ctx.message.header}'`);
  }

  #handleEventMessage(ctx) {
    // console.log(`Received timelapse event '${ctx.message.header}'`);
  }
}

module.exports = OctoPrintWebSocketAdapter;
