import { parse } from "flatted";

let source = null;

async function asyncParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return false;
  }
}

export function createNewEventSource(url) {
  source = new EventSource(url);

  source.onmessage = async function (e) {
    if (e.data != null) {
      const res = await asyncParse(e.data);
      postMessage(res);
    }
  };
  source.onerror = function () {
    postMessage(false);
  };
  source.onclose = function () {
    postMessage(false);
  };
}

self.addEventListener(
  "message",
  function (e) {
    const url = e.data.url;
    createNewEventSource(url);
  },
  false
);
