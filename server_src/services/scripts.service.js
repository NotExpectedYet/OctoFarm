const Logger = require("../handlers/logger.js");
const logger = new Logger("OctoFarm-Scripts");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const wol = require("wake_on_lan");

class ScriptsService {
  async fire(scriptLocation, message) {
    logger.info("Script: ", scriptLocation);
    logger.info("Message: ", message);
    try {
      const { stdout, stderr } = await exec(`${scriptLocation} ${message}`);
      logger.info("stdout:", stdout);
      logger.info("stderr:", stderr);
      return scriptLocation + ": " + stdout;
    } catch (err) {
      logger.error(err);
      return err;
    }
  }

  async wol(wolSettings) {
    const opts = {
      address: wolSettings.ip,
      num_packets: wolSettings.count,
      interval: wolSettings.interval,
      port: wolSettings.port
    };
    const mac = wolSettings.MAC;

    wol.wake(mac, function (error) {
      if (error) {
        logger.error("Couldn't fire wake packet", error);
      } else {
        logger.info("Successfully fired wake packet: ", mac, opts);
      }
    });
  }
}

module.exports = ScriptsService;
