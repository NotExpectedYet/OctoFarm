async function onAppConfigure(app, hostUrl) {
  let adapter;
  if (process.env.MONGO) {
    adapter = require("./adapter/mongo-adapter"); // eslint-disable-line global-require
    await adapter.connect();
  } else if (process.env.OIDC_MEMORY) {
    adapter = require("./adapter/in-memory-adapter"); // eslint-disable-line global-require
  }

  const { createProvider } = require("./middleware/oidc-auth");

  app.use("/oidc", createProvider(hostUrl, adapter).callback());
  app.use("/octoprint", require("./routes/announcing"));
  app.use("/octoprint/announcements", require("./routes/announcements"));
}

async function onAppInitialization() {}

module.exports = {
  onAppConfigure,
  onAppInitialization
};
