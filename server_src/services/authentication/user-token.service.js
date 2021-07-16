function randomString(len) {
  const buf = [],
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    charlen = chars.length;

  for (let i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join("");
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class UserTokenService {
  static tokens = {};

  static async issueTokenWithDone(user, done) {
    const token = randomString(64);

    // Purge beforehand
    await this.clearUserToken(user.id);

    // Create it
    await this.create(token, user.id);

    // Error, value
    done(null, token);
  }

  /**
   * Invalidate the single-use token
   * @param token
   * @param fn
   * @returns {Promise<*>}
   */
  static popRememberMeTokenWithDone(token, fn) {
    if (!token) {
      return fn(false);
    }

    const userId = this.tokens[token];

    return fn(null, userId);
  }

  /**
   * Stores a new printer into the database.
   * @param {Object} token object to create.
   * @param userId
   * @throws {Error} If the printer is not correctly provided.
   */
  static async create(token, userId) {
    if (!token) throw new Error("Missing token to save");

    return (this.tokens[token] = userId);
  }

  /**
   * Clear all tokens, irrespective of user or creation time
   */
  static clearAll() {
    this.tokens = {};
  }

  /**
   * Checks whether one token exists by providing the userToken instance
   */
  static clearUserToken(userId) {
    if (!userId) return;
    const foundTokenIndex = Object.values(this.tokens).findIndex(
      (tokenUserId) => userId === tokenUserId
    );
    if (foundTokenIndex === -1) {
      return;
    }
    delete this.tokens[foundTokenIndex];
  }
}

module.exports = {
  UserTokenService
};
