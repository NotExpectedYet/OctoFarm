const Provider = require("oidc-provider");
const { oidcConfig } = require("../config/oidc-config-base");

let provider;
let storageAdapter;

const getProvider = () => provider;
const getAdapter = () => storageAdapter;

const createProvider = (host = "http://localhost:4000", adapter) => {
  let config = oidcConfig;

  // https://github.com/panva/node-oidc-provider/blob/main/example/adapters/mongodb.js
  // Adapter for storing authentication data
  if (!!adapter) {
    config.adapter = adapter;
    storageAdapter = adapter;
  }

  provider = new Provider(host, config);

  // Debugging middleware
  provider.use(async (ctx, next) => {
    /** pre-processing
     * you may target a specific action here by matching `ctx.path`
     */
    // console.log("pre middleware", ctx.method, ctx.path);

    await next();
    // console.log("post middleware", ctx.method, ctx.oidc?.route);
  });

  return provider;
};

module.exports = {
  createProvider,
  getProvider,
  getAdapter
};
