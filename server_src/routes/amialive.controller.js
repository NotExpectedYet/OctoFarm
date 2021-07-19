const isDocker = require("is-docker");
const { isPm2, isNodemon, isNode } = require("../utils/env.utils");
const { ensureCurrentUserAndGroup } = require("../middleware/users");
const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");

const amIAliveAPI = ({ octofarmUpdateService }) => ({
  index: async (req, res) => {
    let softwareUpdateNotification = octofarmUpdateService.getUpdateNotificationIfAny();

    // ensure update_vailable can only be true when Administrator group found
    if (req?.user?.group !== "Administrator") {
      softwareUpdateNotification.update_available = false;
    }

    res.json({
      ok: true,
      isDockerContainer: isDocker(),
      isNodemon: isNodemon(),
      isNode: isNode(),
      isPm2: isPm2(),
      os: process.env.OS,
      update: softwareUpdateNotification
    });
  }
});

// prettier-ignore
module.exports = createController(amIAliveAPI)
  .prefix("/amialive")
  .before([ensureAuthenticated, ensureCurrentUserAndGroup])
  .get("", "index");
