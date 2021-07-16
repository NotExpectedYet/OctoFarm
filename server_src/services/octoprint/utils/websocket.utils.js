const handle = require("hexnut-handle");

const parseMessage = (message) => {
  const packet = JSON.parse(message);
  const header = Object.keys(packet)[0];
  return {
    header,
    data: message[header]
  };
};

const octoprintParseMiddleware = (ctx, next) => {
  ctx.message = parseMessage(ctx.message);
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
    (ctx) => {}
  );

const matchHeaderMiddleware = (type, callback, err) =>
  handle.matchMessage((body) => body.header === type, safeHandler(callback, err));

module.exports = {
  octoprintParseMiddleware,
  skipAnyHeaderInMiddleware,
  matchHeaderMiddleware
};
