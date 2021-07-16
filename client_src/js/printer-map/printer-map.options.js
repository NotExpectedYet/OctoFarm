// Group parsing constants
export const groupStartNames = ["rij", "row", "group", "groep"];
export const panelPrefix = "panel";
export const selectableTilePrefix = "panel-selectable";
export const stopButtonIdPrefix = "stop-";
export const massDragAndDropId = "mass-drag-and-drop";
export const massDragAndDropStatusId = "mass-drag-and-drop-status";
export const groupSplitString = "_";
export const gutterHalfSize = "6px"; // Be conservative! Keep small screen in mind.
export const blockCountMax = 3; // Indices 0,1,2,3 allowed
export const groupsPerGallery = 4; // Square blocks of 2x2 printers, in Y direction
export const galleries = 3;
export const groupWidth = 2; // Used to translate gallery coordinates to real X
export const groupHeight = 2;
export const mapRealLimits = [
  galleries * groupWidth,
  groupsPerGallery * groupHeight
];

/* MODAL OPTIONS */
export const quickActionsButtonIdPrefix = "quick-actions-";
export const modalPrintFilesListId = "#printFilesList";
export const quickActionsModalId = "#quickActionsModal";
export const actionFileReprintClass = ".actionFileReprint";
export const actionFileDeleteClass = ".actionFileDelete";
export const actionDeleteAllFiles = "actionDeleteAllFiles";
export const actionDeleteAllFilesId = "#" + actionDeleteAllFiles;
export const actionDeleteOldFiles = "actionDeleteOldFiles";
export const actionDeleteOldFilesId = "#" + actionDeleteOldFiles;
export const actionProgressBar = "actionProgressBar";
export const actionProgressBarClass = "." + actionProgressBar;
export const actionProgressSucceeded = "succeeded";
export const actionProgressSucceededClass = "." + actionProgressSucceeded;
export const actionProgressFailed = "failed";
export const actionProgressFailedClass = "." + actionProgressFailed;
export const oldFileCriteriumDays = 14;
export const warningLargeGcodeCollectionCriterium = 500 * 1048576;
export const warningStorageRatioCriterium = 0.8;
export const dangerStorageRatioCriterium = 0.88;
