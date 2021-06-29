const {
  pluginEntryMethods
} = require("../../server_src/plugins/plugin-constants");

describe("plugin-constants", () => {
  it("'pluginEntryMethods' should default to known methods for continuous compatibility", () => {
    expect(pluginEntryMethods).toMatchObject([
      {
        method: "onAppConfigure",
        required: true
      },
      {
        method: "onAppInitialization",
        required: true
      },
      {
        method: "postAppInitialization",
        required: expect.any(Boolean)
      }
    ]);
  });
});
