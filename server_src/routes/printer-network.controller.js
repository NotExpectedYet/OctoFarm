const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const Logger = require("../handlers/logger.js");

class PrinterNetworkController {
  #printerService;

  #logger = new Logger("OctoFarm-API");

  constructor({ printerService }) {
    this.#printerService = printerService;
  }

  async scanSsdp(req, res) {
    const { searchForDevicesOnNetwork } = require("../../server_src/runners/autoDiscovery.js");
    let devices = await searchForDevicesOnNetwork();
    res.json(devices);
  }

  async wakeHost(req, res) {
    const data = req.body;
    this.#logger.info("Action wake host: ", data);
    Script.wol(data);
  }
}

// prettier-ignore
module.exports = createController(PrinterNetworkController)
  .prefix("/printer-network")
  .before([ensureAuthenticated])
  .get("/scan-ssdp", "scanSsdp")
  .post("/wake-host", "wakeHost");
