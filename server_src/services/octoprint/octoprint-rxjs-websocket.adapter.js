const GenericWebsocketAdapter = require("../../handlers/generic-websocket.adapter");
const { retryWhen } = require("rxjs/operators");
const { default: makeWebSocketObservable, normalClosureMessage } = require("rxjs-websockets");
const { concatMap, take, throwError, catchError, delay, map, switchMap, share } = require("rxjs");
const WebSocket = require("ws");
const QueueingSubject = require("../../handlers/queued-subject");
const { WS_STATE } = require("./constants/websocket.constants");
const { parseOctoPrintWebsocketMessage } = require("./utils/websocket.utils");

const _OctoPrintWebSocketRoute = "/sockjs/websocket";

module.exports = class OctoprintRxjsWebsocketAdapter extends GenericWebsocketAdapter {
  // Our OctoPrint data
  #currentUser;
  #sessionKey;
  #throttle;

  #mainSubscription; // Cause the shared socket to be opened
  #socket$;
  messageInputSubject;
  #messageOutput$;

  #state = WS_STATE.unopened;

  constructor({ id, webSocketURL, currentUser, sessionkey, throttle }) {
    super({ id: id.toString(), webSocketURL });

    this.#currentUser = currentUser;
    this.#sessionKey = sessionkey;
    this.#throttle = throttle;

    this.#constructClient();
    this.messageInputSubject = new QueueingSubject();
  }

  #constructClient() {
    const options = {
      makeWebSocket: (url, protocols) => new WebSocket(url, protocols)
    };

    // create the websocket observable, does *not* open the websocket connection
    const constructedUrl = new URL(_OctoPrintWebSocketRoute, this.websocketURL);
    this.#socket$ = makeWebSocketObservable(constructedUrl.href, options);

    // setup the transform pipeline
    this.#messageOutput$ = this.#socket$.pipe(
      switchMap((getResponses) => {
        console.log("asd");
        this.sendSetupData();
        return getResponses(this.messageInputSubject);
      }),
      share(), // share the websocket connection across subscribers
      map((r) => {
        this.#state = WS_STATE.connected;
        return parseOctoPrintWebsocketMessage(r);
      }),
      catchError((error) => {
        const { message } = error;
        if (message === normalClosureMessage) {
          console.log("server closed the websocket connection normally");
          this.#state = WS_STATE.errored;
        } else {
          console.log("socket was disconnected due to error:", message);
          this.#state = WS_STATE.closing;
          throwError(error);
        }
      })
    );
  }

  sendSetupData() {
    const data = { auth: `${this.#currentUser}:${this.#sessionKey}` };
    this.sendMessage(data);

    if (this.#throttle) {
      const throtleSettings = { throttle: this.#throttle };
      this.sendMessage(throtleSettings);
    }
  }

  getState() {
    return this.#state;
  }

  getMessages$() {
    return this.#messageOutput$;
  }

  sendMessage(message) {
    this.messageInputSubject.next(JSON.stringify(message));
  }

  close() {}
};
