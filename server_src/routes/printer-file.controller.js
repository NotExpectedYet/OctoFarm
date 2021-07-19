const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");

const printerFileController = ({ printerFileStore }) => ({
  removeFile: async (req, res) => {
    const file = req.body;
    logger.info("File deletion request: ", file.i);
    await Runner.removeFile(file.i, file.fullPath);
    res.send("success");
  },
  resyncFile: async (req, res) => {
    const file = req.body;
    logger.info("File Re-sync request for: ", file);
    let ret = null;
    if (typeof file.fullPath !== "undefined") {
      ret = await Runner.reSyncFile(file.i, file.fullPath);
    } else {
      ret = await Runner.getFiles(file.i, true);
    }
    // Removed timeout... there's absolutely no reason for it.
    res.send(ret);
  },
  moveFile: async (req, res) => {
    const data = req.body;
    if (data.newPath === "/") {
      data.newPath = "local";
      data.newFullPath = data.newFullPath.replace("//", "");
    }
    logger.info("Move file request: ", data);
    Runner.moveFile(data.index, data.newPath, data.newFullPath, data.fileName);
    res.send({ msg: "success" });
  },
  createFile: async (req, res) => {
    const data = req.body;
    logger.info("Adding a new file to server: ", data);
    Runner.newFile(data);
    res.send({ msg: "success" });
  },
  removeFolder: async (req, res) => {
    const folder = req.body;
    logger.info("Folder deletion request: ", folder.fullPath);
    await Runner.deleteFolder(folder.index, folder.fullPath);
    res.send(true);
  },
  moveFolder: async (req, res) => {
    const data = req.body;
    logger.info("Move folder request: ", data);
    Runner.moveFolder(data.index, data.oldFolder, data.newFullPath, data.folderName);
    res.send({ msg: "success" });
  },
  createFolder: async (req, res) => {
    const data = req.body;
    logger.info("New folder request: ", data);
    Runner.newFolder(data);
    res.send({ msg: "success" });
  }
});

// prettier-ignore
module.exports = createController(printerFileController)
  .prefix("/printer-files")
  .before([ensureAuthenticated])
  .delete("/file", "removeFile")
  .post("/file/resync", "resyncFile")
  .post("/file/move", "moveFile")
  .post("/file/create", "createFile")
  .delete("/folder", "removeFolder")
  .delete("/folder/move", "moveFolder")
  .post("/folder/create", "createFolder");
