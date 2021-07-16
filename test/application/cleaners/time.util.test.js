const { toTimeFormat } = require("../../../server_src/lib/utils/time.util");

describe("timeUtil", function () {
  it("should tolerate unix timestamp and return string with at least h:m format", async function () {
    const resultString = toTimeFormat(Date.now());
    expect(resultString).toBeTruthy();
    expect(typeof resultString).toBe("string");
    expect(resultString).toContain(":");
  });

  it("should tolerate illegal inputs", async function () {
    const inputs = [undefined, null, {}, [], "", 0, -1];
    inputs.forEach((input) => {
      toTimeFormat(input);
    });
  });
});
