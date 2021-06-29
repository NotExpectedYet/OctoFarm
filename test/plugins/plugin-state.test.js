const {
  getPluginPaths,
  setAdditionalPluginPaths,
  resetAdditionalPluginPaths,
  getPluginState,
  resetPluginState
} = require("../../server_src/plugins/plugin-state");

describe("plugin-state", () => {
  it("plugin state should match template object", () => {
    expect(getPluginState()).toMatchObject({
      scannedPlugins: [],
      failedValidationPlugins: [],
      configuredPlugins: [],
      failedToConfigurePlugins: [],
      bootedPlugins: []
    });
  });

  it("plugin reset should set back to default state", () => {
    resetPluginState();

    expect(getPluginState()).toMatchObject({
      scannedPlugins: [],
      failedValidationPlugins: [],
      configuredPlugins: [],
      failedToConfigurePlugins: [],
      bootedPlugins: []
    });
  });

  it("should return default paths with 'getPluginPaths' and change with 'setAdditionalPluginPaths' and 'resetAdditionalPluginPaths'", () => {
    expect(getPluginPaths()).toHaveLength(1);
    setAdditionalPluginPaths(["C:/"]);
    const pluginPaths = getPluginPaths();
    expect(pluginPaths).toHaveLength(2);
    expect(pluginPaths).toContainEqual("C:/");
    resetAdditionalPluginPaths();
    expect(getPluginPaths()).toHaveLength(1);
  });
});
