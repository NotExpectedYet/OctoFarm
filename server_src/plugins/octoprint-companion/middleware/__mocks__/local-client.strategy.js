module.exports = {
  authenticateAccessToken: async (req, res, next) => {
    await next();
  }
};
