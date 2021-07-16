const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const RememberMeStrategy = require("passport-remember-me").Strategy;
const User = require("../models/User.js");
const {
  UserTokenService
} = require("../services/authentication/user-token.service");

module.exports = function (passport) {
  passport.use(
    new RememberMeStrategy(async function (token, done) {
      await UserTokenService.popRememberMeTokenWithDone(token, function (uid) {
        if (!uid) {
          return done(null, !!uid);
        }
        User.findById(uid, (err, user) => {
          if (err) {
            return done(err);
          }
          return done(null, user || false);
        });
      });
    }, UserTokenService.issueTokenWithDone)
  );

  passport.use(
    new LocalStrategy(
      { usernameField: "username" },
      (username, password, done) => {
        // Match User in db
        User.findOne({ username })
          .then((user) => {
            if (!user) {
              return done(null, false, {
                message: "That username is not registered"
              });
            }

            // Match password
            bcrypt.compare(password, user.password, (err, isMatch) => {
              if (err) throw err;

              if (isMatch) {
                return done(null, user);
              }
              return done(null, false, { message: "Password incorrect" });
            });
          })
          .catch((err) => console.log(err));
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });
};
