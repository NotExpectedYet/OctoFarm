const ssdp = require("node-upnp-ssdp");
const fetch = require("node-fetch");
const parseString = require("xml2js").parseString;
const Logger = require("../../server/src/printers/lib/logger.js");

const logger = new Logger("OctoFarm-Server");

const runner = require("./progress/state.js");

const { Runner } = runner;

let discoveredDevices = [];

ssdp.on("DeviceFound", (res) => {
  logger.info("Device found!", res.location);
  if (res.location) {
    fetch(res.location, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.text())
      .then((data) => {
        parseString(data, function (err, result) {
          if (err) {
            logger.error(err);
            return;
          }
          logger.info("Attempting to grab device information!", res.location);
          try {
            if (
              typeof result.root.device !== "undefined" &&
              typeof result.root.device[0].presentationURL !== "undefined"
            ) {
              //Check if it's OctoPrint...
              if (
                typeof result.root.device[0].friendlyName[0] !== "undefined" &&
                result.root.device[0].friendlyName[0].includes("OctoPrint")
              ) {
                let url = result.root.device[0].presentationURL[0];
                url = url.substring(0, url.length - 1);
                let name = result.root.device[0].friendlyName[0];
                if (!name.includes("on")) {
                  name = name.match(/(?:"[^"]*"|^[^"]*$)/)[0].replace(/"/g, "");
                } else {
                  name = "Not Named";
                }
                logger.info("Captured device", res.location);
                discoveredDevices.push({
                  name: name,
                  url: url,
                });
              }
            }
          } catch (e) {
            logger.error(err);
            console.log(err);
          }
        });
      });
  }
});
// ssdp.on("DeviceAvailable", console.log);
// ssdp.on("DeviceUnavailable", console.log);
// ssdp.on("DeviceUpdate", console.log);

let searchForDevicesOnNetwork = async function () {
  logger.info("Running automatic scan...");
  discoveredDevices = [];
  ssdp.mSearch();
  function x() {
    var promise = new Promise(function (resolve, reject) {
      setTimeout(function () {
        ssdp.close;
        resolve(discoveredDevices);
      }, 20001);
    });
    return promise;
  }
  const result = await x();
  return result;
};

module.exports = {
  searchForDevicesOnNetwork,
};
