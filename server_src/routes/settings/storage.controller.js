const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../../middleware/auth");
const Logger = require("../../handlers/logger.js");
const multer = require("multer");

const Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./images");
  },
  filename: function (req, file, callback) {
    callback(null, "bg.jpg");
  }
});
const upload = multer({ storage: Storage });

class StorageController {
  #logger = new Logger("OctoFarm-API");

  constructor({}) {}

  uploadBackgroundImage(req, res) {
    res.redirect("/system");
  }
}

// prettier-ignore
module.exports = createController(StorageController)
  .prefix("/settings")
  .before([ensureAuthenticated])
  .post("/backgroundUpload", "uploadBackgroundImage", {before: [upload.single("myFile")]});
