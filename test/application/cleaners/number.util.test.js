const { floatOrZero } = require("../../../server_src/lib/utils/number.util");

describe("numberUtil", function () {
  it("should tolerate unix timestamp and return number greater than 0", async function () {
    const resultString = floatOrZero(Date.now());
    expect(resultString).toBeTruthy();
    expect(typeof resultString).toBe("number");
    expect(resultString).toBeGreaterThan(0);
  });

  it("should return parsed float when correctly provided float string", async function () {
    const resultString = floatOrZero("0.01");
    expect(resultString).toBeTruthy();
    expect(typeof resultString).toBe("number");
    expect(resultString).toBeGreaterThan(0);
    expect(resultString).toEqual(0.01);
  });

  it("should tolerate illegal inputs", async function () {
    const inputs = [undefined, null, {}, [], "", 0, -1];
    inputs.forEach((input) => {
      floatOrZero(input);
    });
  });
});
