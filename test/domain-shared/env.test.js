const envUtils = require("../../server_src/utils/env.utils");
const path = require("path");

describe("NODE_ENV", () => {
  it("environment should be test", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });
});

describe("Env util package.json check", () => {
  it("should pass validation", () => {
    expect(envUtils.verifyPackageJsonRequirements(__dirname)).toEqual(false);

    expect(
      envUtils.verifyPackageJsonRequirements(path.join(__dirname, "mock-data"))
    ).toEqual(true);
  });
});
