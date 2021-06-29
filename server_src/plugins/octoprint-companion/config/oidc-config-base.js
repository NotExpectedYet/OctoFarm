const { oidcConfigSecret } = require("./oidc-config-secret");

const oidcConfig = {
  cookies: oidcConfigSecret.cookies,
  jwks: oidcConfigSecret.jwks,
  clients: [
    // Temporary shortcut to fix tests
    {
      client_id: process.env.OIDC_CLIENT_ID,
      client_secret: process.env.OIDC_CLIENT_SECRET,
      grant_types: ["authorization_code", "client_credentials"],
      response_types: ["code"],
      // Unused but crashes otherwise
      redirect_uris: ["http://localhost:4000/dashboard"]
    },
    ...oidcConfigSecret.clients
  ],
  grant_types: ["client-credentials"],
  responseTypes: ["code"],
  features: {
    devInteractions: { enabled: false }, //change to true and we don't have to configure interactions url
    clientCredentials: { enabled: true },
    introspection: {
      enabled: true,
      allowedPolicy: async function introspectionAllowedPolicy(
        ctx,
        client,
        token
      ) {
        if (
          client.introspectionEndpointAuthMethod === "none" &&
          token.clientId !== ctx.oidc.client.clientId
        ) {
          return false;
        }
        return true;
      }
    }
  },
  ttl: {
    ClientCredentials: function ClientCredentialsTTL(ctx, token, client) {
      if (token.resourceServer) {
        return token.resourceServer.accessTokenTTL || 10 * 60; // 10 minutes in seconds
      }
      return 10 * 600; // 100 minutes in seconds (10x more than default)
    }
  }
};

module.exports = {
  oidcConfig
};
