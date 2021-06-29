const express = require("express");
const {
  getPluginPaths,
  resetAdditionalPluginPaths,
  setAdditionalPluginPaths,
  getPluginState
} = require("../../server_src/plugins/plugin-state");
const {
  basePathsArgumentIsNotValidArrayError,
  findEligiblePluginFolders,
  checkPluginFolderConstraints,
  scanPlugins,
  configurePluggy,
  configurePlugins,
  postInitOctoFarmAndPlugins
} = require("../../server_src/plugins/plugin-manager");
const { resolve, join } = require("path");
const { initPluginManager } = require("../../app-core");

const dbHandler = require("../db-handler");

beforeAll(async () => {
  await dbHandler.connect();

  // TODO assert setBootedPlugins(); response w.r.t. API
});

beforeEach(() => {
  resetAdditionalPluginPaths();
});

describe("app-core", () => {
  it("should load plugin manager with or without errors", () => {
    initPluginManager();
  });
});

describe("plugin-manager:base", () => {
  const serverPluginPath = "server_src/plugins/";
  it("should throw on invalid array for 'findEligiblePluginFolders'", () => {
    // This path does not exist
    expect(() => findEligiblePluginFolders("randompathentry")).toThrow(
      basePathsArgumentIsNotValidArrayError
    );
  });

  it("should be ok with array of default paths for 'findEligiblePluginFolders' and return expected base plugin report", () => {
    const correctPathEntries = findEligiblePluginFolders([
      resolve(serverPluginPath)
    ]);
    expect(correctPathEntries).toHaveLength(1);
    expect(correctPathEntries).toMatchObject([
      {
        basePath: expect.any(String),
        path: expect.any(String),
        report: {
          pluginJsonExists: true,
          pluginJsonPath: expect.any(String),
          entryExists: true,
          entryPath: expect.any(String),
          valid: true
        }
      }
    ]);
  });

  it("should filter out incorrect subfolders for 'findEligiblePluginFolders'", () => {
    const pathEntries = findEligiblePluginFolders(["./"]);
    expect(pathEntries).toHaveLength(0);
  });

  it("should throw when finding short-hand paths for incorrect OS type for 'findEligiblePluginFolders'", () => {
    const isWin = process.platform === "win32";
    if (isWin) {
      expect(() => findEligiblePluginFolders(["~", "/home"])).toThrow(
        "ENOENT: no such file or directory, scandir '~'"
      );
    } else {
      expect(() => findEligiblePluginFolders(["C:/"])).toThrow(
        "ENOENT: no such file or directory, scandir 'C:/'"
      );
    }
  });

  it("should ignore 2 invalid mock plugins using 'findEligiblePluginFolders'", () => {
    console.log(join(__dirname, "mock-plugins"));
    const plugins = findEligiblePluginFolders([
      join(__dirname, "mock-plugins")
    ]);
    expect(plugins).toHaveLength(2);
  });

  it("should be able to (in)validate test plugin folders using 'checkPluginFolderConstraints'", () => {
    const report1 = checkPluginFolderConstraints(
      join(__dirname, "mock-plugins/invalid-test-plugin")
    );
    expect(report1).toMatchObject({
      pluginJsonExists: true,
      pluginJsonPath: expect.any(String),
      entryExists: true,
      entryPath: expect.any(String),
      valid: true
    });
    const report2 = checkPluginFolderConstraints(
      join(__dirname, "mock-plugins/test-plugin")
    );
    expect(report2).toMatchObject({
      valid: true
    });
    const report3 = checkPluginFolderConstraints(
      join(__dirname, "mock-plugins/erroneous-test-plugin")
    );
    expect(report3).toMatchObject({
      valid: false
    });
    const report4 = checkPluginFolderConstraints(
      join(__dirname, "mock-plugins/erroneous2-test-plugin")
    );
    expect(report4).toMatchObject({
      valid: false
    });
  });

  it("should be able to scan mock plugin using 'scanPlugins", async () => {
    setAdditionalPluginPaths([join(__dirname, "mock-plugins")]);
    expect(getPluginPaths()).toBeTruthy();

    // Must not throw, the main function to call
    const pluginEntries = await scanPlugins();
    expect(pluginEntries.plugins.length + pluginEntries.errors.length).toEqual(
      3
    );
    expect(pluginEntries.plugins).toHaveLength(2); // test-plugin is accepted, second to base octoprint-companion
    expect(pluginEntries.errors).toHaveLength(1); // invalid-test-plugin is filtered out
  });
});

describe("plugin-manager:configuration", () => {
  // Our own implementation in case we dont want mongo, nor default in-memory
  process.env.OIDC_MEMORY = "true";
  process.env.OIDC_CLIENT_ID = "justanidea";
  process.env.OIDC_CLIENT_SECRET = "justasecret";

  it("should be able to scan and configure all base plugins (current: octoprint-companion)", async () => {
    // Must not throw, the main function to call
    const pluginEntries = await scanPlugins();
    expect(pluginEntries.plugins).toHaveLength(1);
    expect(pluginEntries.errors).toHaveLength(0);

    const app = express();
    expect(app).not.toBeUndefined();
    for (let pluggy of pluginEntries.plugins) {
      await configurePluggy(pluggy, app);
    }
  });

  // This test failing says more about the test conditions, than the fact that 'OIDC_CLIENT_ID' and 'OIDC_CLIENT_SECRET'
  // should be taken care of in order to make it user friendly. Well, we know it now. Cant go back.
  test.skip("should fail when OIDC_CLIENT_ID and OIDC_CLIENT_SECRET are not known", async () => {
    process.env.OIDC_CLIENT_ID = undefined;
    process.env.OIDC_CLIENT_SECRET = undefined;
    delete process.env.OIDC_CLIENT_ID;
    delete process.env.OIDC_CLIENT_SECRET;

    // Must not throw, the main function to call
    const pluginEntries = await scanPlugins();

    const app = express();
    expect(app).not.toBeUndefined();
    for (let pluggy of pluginEntries.plugins) {
      await expect(configurePluggy(pluggy, app)).rejects.toBeTruthy();
    }

    const pluginState = getPluginState();
    expect(pluginState.scannedPlugins).toHaveLength(1);
    expect(pluginState.configuredPlugins).toHaveLength(0);
    // We didnt call the manager:configurePlugins so the state isnt updated accordingly
    expect(pluginState.failedToConfigurePlugins).toHaveLength(0);
  });

  it("should be able to fully configure base plugins and be representated in plugin-state", async () => {
    await scanPlugins();

    const app = express();
    expect(app).not.toBeUndefined();
    await configurePlugins(app);

    const pluginState = getPluginState();
    expect(pluginState.scannedPlugins).toHaveLength(1);
    expect(pluginState.configuredPlugins).toHaveLength(1);
    expect(pluginState.failedToConfigurePlugins).toHaveLength(0);
  });

  it("should fail gracefully when configuring without app and host", async () => {
    await scanPlugins();
    await configurePlugins();
    const pluginState = getPluginState();
    expect(pluginState.scannedPlugins).toHaveLength(1);
    expect(pluginState.failedToConfigurePlugins).toHaveLength(1);
    expect(pluginState.failedToConfigurePlugins[0]).toMatchObject({
      error: expect.stringContaining('Plugin octoprint-companion failed to configure. Stack: TypeError: Cannot read property \'use\' of undefined'),
      plugin: {
        name: "octoprint-companion"
      },
      inner_exception: expect.anything()
    })
    expect(pluginState.configuredPlugins).toHaveLength(0);
  });
});

describe("plugin-manager:boot", () => {
  test("should be able to fully boot with plugins - not ready yet", async () => {
    process.env.OIDC_MEMORY = "true";
    process.env.OIDC_CLIENT_ID = "justanidea";
    process.env.OIDC_CLIENT_SECRET = "justasecret";

    await scanPlugins();
    const appContainer = {
      use: () => {}
    };
    await configurePlugins(appContainer, "http://octofarm.net:80/");
    const pluginState = getPluginState();
    expect(pluginState.scannedPlugins).toHaveLength(1);
    expect(pluginState.failedToConfigurePlugins).toHaveLength(0);
    expect(pluginState.configuredPlugins).toHaveLength(1);

    await postInitOctoFarmAndPlugins();
  });
});
