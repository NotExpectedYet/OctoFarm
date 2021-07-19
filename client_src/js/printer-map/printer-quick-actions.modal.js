import { humanFileSize } from "../utils/file-size.util";
import { secondsToTime, timeDifference } from "../utils/time.util";
import {
  actionDeleteAllFiles,
  actionDeleteOldFiles,
  actionProgressBar,
  actionProgressBarClass,
  actionProgressFailed,
  actionProgressFailedClass,
  actionProgressSucceeded,
  actionProgressSucceededClass,
  oldFileCriteriumDays
} from "./printer-map.options";
import { printerWebBtn } from "../lib/modules/Printers/actionButtons";
import {
  calculatePrinterSystemStorageBadges,
  calculatePrinterSystemStorageStats,
  findOldFiles
} from "./printer-map.utils";

export function getFileRow(file, index) {
  return `
  <tr id="file-${file.fullPath}">
    <td>
      ${file.name}
    </td>
    <td class="text-right">
      <strong class="badge badge-dark">${humanFileSize(file?.fileSize, true)}</strong>
    </td>
    <td>${timeDifference(Date.now(), file.uploadDate * 1000)}</td>
    <td>${secondsToTime(file.expectedPrintTime)}</td>
    <td>
      <div class="dropdown">
        <button class="btn btn-sm btn-dark dropdown-toggle" id="dropdownMenuButton-${index}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>
        <div id="fileActionsMenu-${index}" class="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <span class="dropdown-item actionFileReprint" data-file-id="${index}">
            <i class="fa fa-print"></i> Reprint
          </span>
          <span class="dropdown-item actionFileDelete" data-file-id="${index}" style="color: Tomato;">
            <i class="fa fa-trash"></i> Delete
          </span>
        </div>
      </div>
    </td>
  </tr>
  `;
}

function getSortedPrinterFiles(fileInfo) {
  const fileList = fileInfo?.fileList;
  if (!fileInfo?.fileList || fileInfo.filecount === 0) return;
  return fileList.sort((f1, f2) => f2.uploadDate - f1.uploadDate);
}

export function getPrinterFileRows(sortedFiles) {
  let listHtml = "";

  if (!!sortedFiles) {
    for (let [index, file] of sortedFiles.entries()) {
      listHtml += getFileRow(file, index);
    }
  } else {
    listHtml += "<tr><td>No files present.</td></tr>";
  }

  return listHtml;
}

export function hideProgressBar(max) {
  $(actionProgressBarClass).hide();
}

export function resetProgressBar(max) {
  $(actionProgressSucceededClass).width("0%");
  $(actionProgressFailedClass).width("0%");
  $(actionProgressBarClass).show();
}

/**
 * Tester function
 * @param max
 */
export function testSetProgressBar(max) {
  const failedRatio = ((100 * 3) / 14).toFixed(0);
  $(actionProgressSucceededClass).width("10%");
  $(actionProgressFailedClass).width(`${failedRatio}%`);
  $(actionProgressBarClass).show();
}

export function setProgressBar(success, failed, max) {
  const successRatio = ((100 * success) / max).toFixed(0);
  const failedRatio = ((100 * failed) / max).toFixed(0);
  $(actionProgressSucceededClass).width(`${successRatio}%`);
  $(actionProgressFailedClass).width(`${failedRatio}%`);
  $(actionProgressBarClass).show();
}

export const printerQuickActionsModal = (printer) => {
  // We could filter on days later (f.e. with a dropdown or input)
  const presetFilterOldFilesDays = oldFileCriteriumDays;

  const files = printer?.fileList;
  const fileListSorted = getSortedPrinterFiles(files);
  const filesOutdated = findOldFiles(fileListSorted, presetFilterOldFilesDays);
  const storageStats = calculatePrinterSystemStorageStats(printer, presetFilterOldFilesDays);
  const storageBadges = calculatePrinterSystemStorageBadges(storageStats);

  const hasNoOutdatedFiles = !filesOutdated || filesOutdated?.length === 0;
  const hasFiles = !!fileListSorted?.length;
  return `
<span>There are ${filesOutdated?.length || "no"} old files (older than 2 weeks).
</span><br/>

<strong>
    Storage Free: <span class="badge ${storageBadges.storageRatioBadge}">${humanFileSize(
    storageStats.storageFree
  )} of ${humanFileSize(storageStats.storageTotal)}</span><br/>
    Removable (${presetFilterOldFilesDays} days+): <span class="badge ${
    storageBadges.clearedOldFilesBadge
  }">${humanFileSize(storageStats.clearedStorageOldFiles)}</span><br/>
    Removable (all): <span class="badge ${storageBadges.clearedAllFilesBadge}">${humanFileSize(
    storageStats.clearedStorageAllFiles
  )}</span>
</strong><br/>

<hr style="margin: 10px 0 10px 0;" />

<button class="btn btn-outline-warning ${
    hasNoOutdatedFiles ? "disabled" : ""
  }" id="${actionDeleteOldFiles}">Clear ${filesOutdated?.length} old files (2 weeks+)</button>
<button ${
    hasFiles ? "" : "disabled "
  } class="btn btn-outline-danger" id="${actionDeleteAllFiles}">Clear all ${
    fileListSorted?.length
  } files</button>
${printerWebBtn(printer._id, printer.printerURL)}<br/>

<div class="progress ${actionProgressBar}" style="margin-top:10px;">
  <div role="progressbar" class="${actionProgressSucceeded} progress-bar bg-success progress-bar-striped progress-bar-animated" style="width:0%">
    Processed
  </div>
  <div role="progressbar" class="${actionProgressFailed} progress-bar bg-danger" style="width:0%">
    Failed
  </div>
</div>

<hr style="margin: 10px 0 10px 0;" />

<table class="table table-secondary" style="margin-top:10px;">
  <thead>
    <th>File</th>
    <th class="text-right">Size</th>
    <th>Upload Date</th>
    <th>Duration (sec)</th>
    <th>Action</th>
  </thead>
  <tbody>
    ${getPrinterFileRows(fileListSorted)}
  </tbody>
</table>
`;
};
