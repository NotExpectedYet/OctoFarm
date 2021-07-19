const { checkPluginManagerAPIDeprecation } = require("../../server_src/utils/compatibility.utils");

describe("CompatibilityUtil", () => {
  it("new PluginManager API should be compatible with versions >= 1.6.0", () => {
    expect(checkPluginManagerAPIDeprecation("1.5.3")).toBe(false);
    expect(checkPluginManagerAPIDeprecation("1.6.0")).toBe(true);
    expect(checkPluginManagerAPIDeprecation("2.0.0.dev1385+gb202c6db5.dirty")).toBe(true);
    expect(checkPluginManagerAPIDeprecation("1.5.3.dev1385+gb202c6db5.dirty")).toBe(false);
    expect(checkPluginManagerAPIDeprecation("1.6.0.dev1385+gb202c6db5.dirty")).toBe(true);
  });
});
