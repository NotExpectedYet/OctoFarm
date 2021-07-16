const dbHandler = require("../db-handler");
const User = require("../../server_src/models/User");
const bcrypt = require("bcryptjs");

/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
  await dbHandler.connect();
});

/**
 * Clear all test data after every test.
 */
afterEach(async () => {
  await dbHandler.clearDatabase();
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => {
  await dbHandler.closeDatabase();
});

describe("User:Schema", function () {
  it("should not tolerate duplicate usernames", async () => {
    const newUser = new User({
      name: "testname",
      username: "SAMENAME",
      password: "pwpwpwpw123",
      group: "User"
    });
    const newUser2 = new User({
      name: "testname2",
      username: "SAMENAME",
      password: "pwpwpwpw123",
      group: "User"
    });

    // Hash Password
    const salt = bcrypt.genSaltSync(10);
    expect(salt).not.toBeUndefined();
    const hash = bcrypt.hashSync(newUser.password, salt);
    expect(hash).not.toBeUndefined();

    // Set password to hashed
    newUser.password = hash;
    newUser2.password = hash;
    // Save new User
    await newUser.save();
    let wasThrown = false;
    await newUser2.save().catch((e) => {
      wasThrown = true;
    });
    expect(wasThrown).toBe(true);

    const users = await User.find({ username: "SAMENAME" });
    expect(users).toHaveLength(1);
  });
});
