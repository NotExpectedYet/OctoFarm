const EVENT_TYPES = {
  ClientAuthed: 0,
  ClientClosed: 1,
  ClientOpened: 2,
  Connected: 3,
  Disconnecting: 4,
  Disconnected: 5,
  Dwelling: 6,
  FileAdded: 7,
  FileDeselected: 8,
  FileRemoved: 9,
  FirmwareData: 10, // Not modeled yet
  FolderAdded: 11,
  FolderRemoved: 12, // Not modeled yet
  Home: 13,
  MetadataAnalysisFinished: 14,
  MetadataAnalysisStarted: 15,
  MetadataStatisticsUpdated: 16,
  PositionUpdate: 17,
  PrintCancelled: 18,
  PrintCancelling: 19,
  PrintDone: 20,
  PrintFailed: 21,
  PrintPaused: 22,
  PrintStarted: 23,
  PrinterStateChanged: 24,
  TransferDone: 25,
  TransferStarted: 26,
  UpdatedFiles: 27,
  Upload: 28,
  UserLoggedIn: 29,
  ZChange: 30
};

const OP_WS_MSG = {
  connected: "connected",
  reauthRequired: "reauthRequired",
  current: "current",
  history: "history",
  event: "event",
  plugin: "plugin",
  timelapse: "timelapse",
  slicingProgress: "slicingProgress"
};

const OP_WS_SKIP = [OP_WS_MSG.slicingProgress, OP_WS_MSG.timelapse];

const WS_STATE = {
  unopened: "unopened",
  opening: "opening",
  connected: "connected",
  errored: "errored", // Not a disconnect error
  closing: "closing", // Closing error received
  timeout: "timeout" // Retrying is in timeout
};

module.exports = {
  EVENT_TYPES,
  WS_STATE,
  OP_WS_MSG,
  OP_WS_SKIP
};
