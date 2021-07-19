import {
  blockCountMax,
  dangerStorageRatioCriterium,
  groupHeight,
  groupSplitString,
  groupStartNames,
  groupWidth,
  oldFileCriteriumDays,
  warningLargeGcodeCollectionCriterium,
  warningStorageRatioCriterium
} from "./printer-map.options";

export function cleanPrinterName(printer) {
  if (!printer) {
    return "";
  }
  let name = printer.printerName;
  if (name.includes("http://")) {
    name = name.replace("http://", "");
  } else if (name.includes("https://")) {
    name = name.replace("https://", "");
  }
  return `${name}`;
}

export function parseGroupLocation(printer) {
  if (!printer.group) {
    return;
  }
  if (typeof printer.group !== "string") {
    throw new Error("Printer group not a string. Contact DEV~ID.");
  }
  let hasGroupStartName = false;
  let printerGroupCut = "";

  for (var i = 0; i < groupStartNames.length; i++) {
    if (printer.group.toLowerCase().indexOf(groupStartNames[i]) > -1) {
      hasGroupStartName = true;
      printerGroupCut = printer.group.toLowerCase().replace(groupStartNames[i], "");
    }
  }

  if (!hasGroupStartName) {
    throw new Error(
      `Printer group does not meet convention (value: ${printer.group}). Contact DEV~ID.`
    );
  }
  const splitPrinterGroupName = printerGroupCut.split(groupSplitString);
  if (!splitPrinterGroupName?.length > 1) {
    throw new Error(
      "Printer group name is not according to x_x location convention. Contact DEV~ID."
    );
  }
  return splitPrinterGroupName.map((gn) => parseInt(gn));
}

export function combineSubAndNormalCoords(coord, subCoord) {
  return [coord[0] * groupWidth + subCoord[0], coord[1] * groupHeight + subCoord[1]];
}

export function findPrinterWithBlockCoordinate(parsedPrinters, coordinateXY) {
  if (!parsedPrinters) {
    return false;
  }
  return parsedPrinters
    .filter((pm) => !!pm?.realCoord)
    .find((pm) => pm?.realCoord[0] === coordinateXY[0] && pm?.realCoord[1] === coordinateXY[1]);
}

export function convertPrinterURLToXYCoordinate(printer) {
  if (!printer) return [-1, -1];
  const printerIPPort = printer.printerURL.replace("http://", "").replace("https://", "");
  const splitIPPort = printerIPPort.split(":");
  if (!splitIPPort) {
    return;
  }
  // No specifier found
  if (splitIPPort.length === 1) {
    return [1, 1];
  }
  const parsedPort = parseInt(splitIPPort[1]) % 10;
  if (parsedPort > blockCountMax) {
    console.warn(
      "This printer's port is not recognizable in the 0,1,2,3 block index. Contact DEV~ID."
    );
    return [-1, -1];
  }
  // Y (0;1)
  // ^
  // [3; 0]
  // [2; 1] > X (0;1)
  return [parsedPort < 2 ? 1 : 0, parsedPort === 3 || parsedPort === 0 ? 1 : 0];
}

export function findOldFiles(fileList, filterCriteriumDays = oldFileCriteriumDays) {
  if (!fileList) return [];
  return fileList.filter(
    (f) => Date.now() / 1000 > f.uploadDate + filterCriteriumDays * 24 * 60 * 60
  );
}

export function fileListStorageSize(fileList) {
  return fileList.reduce((t, b) => t + b.fileSize, 0);
}

export function printerStorageRatio(printer) {
  return printer.storage.free / printer.storage.total;
}

export function calculatePrinterSystemStorageStats(printer, oldFilesCriteriumDays = 14) {
  const fileList = printer.fileList.fileList;
  const clearedStorageAllFiles = fileListStorageSize(fileList);
  const clearedStorageOldFiles = fileListStorageSize(findOldFiles(fileList, oldFilesCriteriumDays));
  return {
    storageTotal: printer.storage.total,
    storageFree: printer.storage.free,
    clearedStorageOldFiles,
    clearedStorageAllFiles
  };
}

export function calculatePrinterSystemStorageBadges(storageStats) {
  const storageRatio = storageStats.storageFree / storageStats.storageTotal;

  return {
    storageRatioBadge:
      storageRatio > dangerStorageRatioCriterium
        ? "badge-danger"
        : storageRatio > warningStorageRatioCriterium
        ? "badge-warning"
        : "badge-primary",
    clearedOldFilesBadge:
      storageStats.clearedStorageOldFiles > warningLargeGcodeCollectionCriterium
        ? "badge-warning"
        : "badge-primary",
    clearedAllFilesBadge:
      storageStats.clearedStorageAllFiles > warningLargeGcodeCollectionCriterium
        ? "badge-warning"
        : "badge-primary"
  };
}
