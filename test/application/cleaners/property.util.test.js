const {
  toDefinedKeyValue
} = require("../../../server_src/lib/utils/property.util");

function conditionUnderTest(prop) {
  return typeof prop !== "undefined" && prop !== null;
}

function unitUnderTest(someCondition, value, key) {
  return {
    ...(someCondition ? { [key]: value } : {})
  };
}

describe("toDefinedKeyValue", function () {
  const key = "testKey";
  const undefinedValue = undefined;
  const trueValue = true;

  it("unitUnderTest should return empty or non-empty object", async function () {
    const result = unitUnderTest(
      conditionUnderTest(undefinedValue),
      undefinedValue,
      key
    );
    expect(result).toEqual({});

    const result2 = unitUnderTest(
      conditionUnderTest(trueValue),
      trueValue,
      key
    );
    expect(result2).toEqual({ [key]: trueValue });
  });

  it("unitUnderTest should correctly allow using spreading operator to avoid concatting null or undefined properties", async function () {
    const knownProperty = "testKey2";
    const result = {
      [knownProperty]: true,
      ...unitUnderTest(conditionUnderTest(trueValue), trueValue, key)
    };

    expect(result).toHaveProperty(knownProperty);
    expect(result.key).toBeUndefined();
  });

  it("should correctly allow using spreading operator to avoid null or undefined properties", async function () {
    const knownProperty = "testKey2";
    const result = {
      [knownProperty]: true,
      ...toDefinedKeyValue(trueValue, key)
    };

    expect(result).toHaveProperty(knownProperty);
    expect(result.key).toBeUndefined();
  });
});
