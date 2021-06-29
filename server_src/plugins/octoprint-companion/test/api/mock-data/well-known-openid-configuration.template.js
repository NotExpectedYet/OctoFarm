module.exports = (host) => {
  return {
    authorization_endpoint: new URL("/oidc/auth", host).href,
    claims_parameter_supported: false,
    claims_supported: ["sub", "sid", "auth_time", "iss"],
    code_challenge_methods_supported: ["S256"],
    end_session_endpoint: new URL("/oidc/session/end", host).href,
    grant_types_supported: [
      "authorization_code",
      "refresh_token",
      "client_credentials"
    ],
    id_token_signing_alg_values_supported: ["PS256", "RS256", "ES256"],
    issuer: host,
    jwks_uri: new URL("/oidc/jwks", host).href,
    response_modes_supported: ["form_post", "fragment", "query"],
    response_types_supported: ["code"],
    scopes_supported: ["openid", "offline_access"],
    subject_types_supported: ["public"],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_jwt",
      "client_secret_post",
      "private_key_jwt",
      "none"
    ],
    token_endpoint_auth_signing_alg_values_supported: [
      "HS256",
      "RS256",
      "PS256",
      "ES256",
      "EdDSA"
    ],
    token_endpoint: new URL("/oidc/token", host).href,
    request_object_signing_alg_values_supported: [
      "HS256",
      "RS256",
      "PS256",
      "ES256",
      "EdDSA"
    ],
    request_parameter_supported: false,
    request_uri_parameter_supported: true,
    require_request_uri_registration: true,
    userinfo_endpoint: new URL("/oidc/me", host).href,
    introspection_endpoint: new URL("/oidc/token/introspection", host).href,
    introspection_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_jwt",
      "client_secret_post",
      "private_key_jwt",
      "none"
    ],
    introspection_endpoint_auth_signing_alg_values_supported: [
      "HS256",
      "RS256",
      "PS256",
      "ES256",
      "EdDSA"
    ],
    claim_types_supported: ["normal"]
  };
};
