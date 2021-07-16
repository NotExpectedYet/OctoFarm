function convertHttpUrlToWebsocket(url) {
  if (url.includes("http://")) {
    return url.replace("http://", "ws://");
  } else if (url.includes("https://")) {
    return url.replace("https://", "wss://");
  } else if (!url.includes("ws://")) {
    return "ws://" + url;
  }
}

module.exports = {
  convertHttpUrlToWebsocket
};
