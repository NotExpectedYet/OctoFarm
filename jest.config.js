module.exports = {
  testEnvironment: "node",
  testTimeout: 5000,
  modulePathIgnorePatterns: ["server_2x"],
  globalSetup: "./test/global.setup.js",
  moduleNameMapper: {
    // https://github.com/panva/jose/discussions/110
    "jose(.*)": "<rootDir>/node_modules/jose/dist/node/cjs/$1.js"
  }
};
