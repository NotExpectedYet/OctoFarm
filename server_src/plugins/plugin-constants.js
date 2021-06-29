//** Plugin 'plugin.json' template **/
const pluginJsonTemplate = {
  name: "Provide a 'name' property to identify the plugin with",
  description:
    "Provide a 'description' property to help users understand the goal(s) for this plugin",
  author: "Name the creator/maintainer of the plugin",
  repository:
    "Provide the username/repository, organization/repository or full github URL for this repository",
  release: "Provide NPM release name",
  dependencies:
    "(Not yet implemented) Provide a key-value semver map for dependencies (same as package.json:dependencies)",
  devDependencies:
    "(Not yet implemented) Provide a key-value semver map for dependencies to be installed in development only (same as package.json:devDependencies)",
  version:
    "(Not yet implemented) Provide the semver version to check for updates.",
  minVersion:
    "(Not yet implemented) Provide an OctoFarm semver version requirement."
};

//** Plugin 'entry.js' template **/
const pluginEntryTemplate = {
  onAppConfigure: async (app) => {
    //...
  },
  onAppInitialization: async (app) => {
    // ...
  },
  postAppInitialization: async () => {
    // ...
  }
};

const pluginEntryMethods = [
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
    required: false
  }
];

const getDefaultPluginsState = () => {
  return {
    scannedPlugins: [],
    failedValidationPlugins: [],
    configuredPlugins: [],
    failedToConfigurePlugins: [],
    bootedPlugins: []
  };
};

module.exports = {
  pluginEntryMethods,
  getDefaultPluginsState
};
