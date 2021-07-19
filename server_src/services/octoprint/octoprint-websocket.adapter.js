const HexNutClient = require("hexnut-client");
const handle = require("hexnut-handle");
const ws = require("ws");
const GenericWebsocketAdapter = require("../../handlers/generic-websocket.adapter");
const { Subject, Observable } = require("rxjs");
const { OP_WS_MSG, OP_WS_SKIP } = require("./constants/websocket.constants");
const {
  octoPrintWebSocketRawDebug,
  octoprintParseMiddleware,
  octoPrintWebSocketPostDebug,
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
  messageSubject;

  constructor({ id, webSocketURL, currentUser, sessionkey, throttle }) {
    super({ id: id.toString(), webSocketURL });

    this.#currentUser = currentUser;
    this.#sessionKey = sessionkey;
    this.#throttle = throttle;

    this.#constructClient();
    this.messageSubject = new Subject();
  }

  #constructClient() {
    this.#client = new HexNutClient({ followRedirects: true }, ws);
  }

  getMessageSubject() {
    return this.messageSubject;
  }

  /**
   * @override This implements the opening/connecting action of our base class
   */
  start() {
    if (!this.#currentUser || !this.#sessionKey) {
      throw new Error(
        `#currentUser: ${this.#currentUser} or #sessionKey ${
          this.#sessionKey
        } not set. Adapter failed to start.`
      );
    }
    this.#client.use(
      handle.connect((ctx) => {
        this.sendSetupData(ctx);
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

    // Decide your recipe for adjusting to OctoPrint messages
    this.#client.use(octoPrintWebSocketRawDebug);
    this.#client.use(octoprintParseMiddleware);
    this.#client.use(skipAnyHeaderInMiddleware(OP_WS_SKIP));
    this.#client.use(octoPrintWebSocketPostDebug);
    this.#client.use(matchHeaderMiddleware(OP_WS_MSG.connected, this.#onConnection));
    this.#client.use(
      matchHeaderMiddleware(OP_WS_MSG.current, (ctx) => {
        this.#handleCurrentMessage(ctx);
      })
    );
    this.#client.use(matchHeaderMiddleware(OP_WS_MSG.history, this.#handleHistoryMessage));
    this.#client.use(matchHeaderMiddleware(OP_WS_MSG.timelapse, this.#handleTimelapseMessage));
    this.#client.use(matchHeaderMiddleware(OP_WS_MSG.event, this.#handleEventMessage));

    this.#client.use((ctx) => {
      console.log(`OP Message received '${ctx.message.header}'`);
      this.messageSubject.next(ctx.message);
    });

    const constructedUrl = new URL("/sockjs/websocket", this.websocketURL);
    this.#client.connect(constructedUrl);
  }

  sendSetupData(ctx) {
    const data = { auth: `${this.#currentUser}:${this.#sessionKey}` };
    ctx.send(JSON.stringify(data));

    if (this.#throttle) {
      const throtleSettings = { throttle: this.#throttle };
      ctx.send(JSON.stringify(throtleSettings));
    }
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
    // console.log(`Adapter '${ctx.message.header}'`);
    this.messageSubject.next(ctx.message);
  }

  #handleHistoryMessage(ctx) {
    // console.log(`Received history event '${ctx.message.header}'`);
    this.messageSubject.next(ctx.message);
  }

  #handleTimelapseMessage(ctx) {
    // console.log(`Received timelapse event '${ctx.message.header}'`);
    this.messageSubject.next(ctx.message);
  }

  #handleEventMessage(ctx) {
    console.log(`Received event '${ctx.message.header}'`);
    this.messageSubject.next(ctx.message);
  }
}

module.exports = OctoPrintWebSocketAdapter;
