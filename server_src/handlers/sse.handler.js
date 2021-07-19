class ServerSentEventsHandler {
  #clientId = 0;
  #clients = [];

  constructor({}) {}

  handleRequest(req, res) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: 0,
      Connection: "keep-alive"
    });
    res.write("\n");
    this.#clients[this.#clientId] = res;
    req.on("close", () => {
      delete this.#clients[this.#clientId];
    });
    req.on("error", () => {
      delete this.#clients[this.#clientId];
    });

    // TODO isnt this index tracker prone to bugs? What if an older client closes its connection?
    this.#clientId++;
  }

  send(data) {
    this.#clients.forEach((c, index) => {
      c.write("data: " + data + "\n\n");
    });
  }
}

module.exports = ServerSentEventsHandler;
