const handle = require("hexnut-handle");
const { byteCount } = require("../../../utils/benchmark.util");

let DEBUG = false;
const octoPrintWebSocketRawDebug = (ctx, next) => {
  if (DEBUG) {
    console.log(`${Date.now()} WS msg size ${byteCount(ctx.message)} bytes`);
  }
  next();
};

const parseMessage = (message) => {
  const packet = JSON.parse(message);
  const header = Object.keys(packet)[0];
  return {
    header,
    data: packet[header]
  };
};

const octoprintParseMiddleware = (ctx, next) => {
  ctx.message = parseMessage(ctx.message);
  next();
};

const octoPrintWebSocketPostDebug = (ctx, next) => {
  if (ctx?.message?.data && DEBUG) {
    console.log(
      `${Date.now()} WS '${ctx.message.header}' parsed keys: ${Object.keys(ctx.message.data)}`
    );
  }
  next();
};

const safeHandler = (callback, err) => async (ctx) => {
  try {
    await callback(ctx);
  } catch (e) {
    if (err) {
      err(e);
    }
  }
};

const skipAnyHeaderInMiddleware = (types, err) =>
  handle.matchMessage(
    (body) => !!types.includes(body.header),
    (ctx) => {
      if (DEBUG) {
        console.log(`${Date.now()} skipped WS msg header ${ctx.message.header} in ${types}`);
      }
    }
  );

const matchHeaderMiddleware = (type, callback, err) =>
  handle.matchMessage((body) => body.header === type, safeHandler(callback, err));

module.exports = {
  octoPrintWebSocketRawDebug,
  octoprintParseMiddleware,
  octoPrintWebSocketPostDebug,
  skipAnyHeaderInMiddleware,
  matchHeaderMiddleware
};
