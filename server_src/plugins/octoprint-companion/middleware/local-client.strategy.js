const { getAdapter } = require("./oidc-auth");

const bearerPrefix = "Bearer ";
module.exports = {
  authenticateAccessToken: async (req, res, next) => {
    try {
      const bearer = req.headers.authorization;
      if (!bearer || !bearer?.includes(bearerPrefix)) {
        // bypasses route1 and route2
        // errorHandler will be called with the error
        res.status(401);
        res.send({
          error: "Unauthorized",
          error_description: !bearer
            ? "authorization header missing"
            : "authorization not prefixed with 'Bearer' scheme"
        });
        return;
      }
      const token = bearer.split(bearerPrefix)[1];

      if (!token || token?.length !== 43) {
        // bypasses route1 and route2
        // errorHandler will be called with the error
        res.status(401);
        res.send({
          error: "Unauthorized",
          error_description: !token
            ? "bearer token is missing"
            : "bearer token is not length 43",
          token
        });
        return;
      }

      // Biggest hack of my life
      const adapterClass = getAdapter();
      const introspection = await new adapterClass("client_credentials").find(
        token
      );

      if (!introspection) {
        res.status(401);
        res.send({
          error: "Unauthorized",
          error_description: "bearer token is not valid"
        });
        return;
      }

      if (Date.now() > introspection.exp * 1000) {
        res.status(401);
        res.send({
          error: "Unauthorized",
          error_description: "bearer token is expired"
        });
        return;
      }

      req.client = introspection;

      await next();
    } catch (e) {
      res.status(500);
      res.send({
        error: "Internal Server Error",
        error_description: e.message
      });
    }
  }
};
