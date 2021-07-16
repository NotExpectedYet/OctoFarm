const auth = jest.createMockFromModule("../auth");

auth.ensureAuthenticated = async (req, res, next) => {
  req.user = {
    name: undefined
  };
  next();
};

module.exports = auth;
