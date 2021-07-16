const downloadUtil = jest.createMockFromModule("../download.util");

downloadUtil.downloadFromOctoPrint = async (url, path, callback, apiKey) => {
  return Promise.resolve();
};

downloadUtil.downloadImage = async (url, path, apiKey, callback) => {
  const validateURL = new URL(url);
  if (apiKey.length !== 32)
    throw "Api key length not 32 - this is a test-only error.";

  callback();
};

module.exports = downloadUtil;
