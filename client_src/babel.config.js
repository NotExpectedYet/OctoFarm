module.exports = (api) => {
  // https://jestjs.io/docs/en/getting-started#using-babel
  const isTest = api.env("test");
  // You can use isTest to determine what presets and plugins to use.
  if (isTest) {
    return {};
  }
  return {
    presets: [
      [
        "@babel/preset-env",
        {
          debug: api.env("production"),
          useBuiltIns: "entry"
        }
      ]
    ]
  };
};
