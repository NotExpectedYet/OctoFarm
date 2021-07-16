export function returnPrinterTableRow(printer) {
  return `
        <tr id="printerCard-${printer._id}">
        <td class="align-middle">
             <span title="Check printer settings, API issues detected..."
                 id="scanningIssues-${printer._id}"
                 type="button"
                 class="tag btn btn-danger btn-sm d-none"
                 data-toggle="modal"
                 data-target="#printerSettingsModal"
                >
                <i class="fas fa-exclamation-triangle"></i>
            </span>
            <span title="Drag and Change your Printers sorting"  id="printerSortIndex-${printer._id}"
                   class="btn btn-light btn-sm sortableList" style="vertical-align: middle"><i class="fas fa-spinner fa-spin"></i>
            </span>
        </td>
        <td class="align-middle" id="printerName-${printer._id}"></td>
        <td class="align-middle" id="printerActionBtns-${printer._id}"></td>
        <td class="align-middle">
            <button  title="Change your Printer Settings"
                 id="printerSettings-${printer._id}"
                 type="button"
                 class="tag btn btn-secondary btn-sm bg-colour-1"
                 data-toggle="modal"
                 data-target="#printerSettingsModal"
                >
                <i class="fas fa-cog"></i>
            </button>
            <button  title="View logs for your printer"
                 id="printerLog-${printer._id}"
                 type="button"
                 class="tag btn btn-secondary btn-sm bg-colour-2"
                 data-toggle="modal"
                 data-target="#printerLogsModal"
            >
                <i class="fas fa-file-alt"></i>
            </button>
              <button title="View individual Printer Statistics"
                     id="printerStatistics-${printer._id}"
                     type="button"
                     class="tag btn btn-secondary btn-sm bg-colour-3"
                     data-toggle="modal"
                     data-target="#printerStatisticsModal"
                >
                <i class="fas fa-chart-pie"></i>
              </button>
               <button  title="Setup and track Maintenance Issues with Printers"
                     id="printerMaintenance-${printer._id}"
                     type="button"
                     class="tag btn btn-secondary btn-sm bg-colour-4 d-none"
                     data-toggle="modal"
                     data-target="#printerMaintenanceModal"
                     disabled
                >
                    <i class="fas fa-wrench"></i>
                </button>
                <button title="No OctoPrint updates available!" id="octoprintUpdate-${printer._id}" class='tag btn btn-secondary btn-sm bg-colour-1' disabled><i class="fas fa-desktop"></i></button>
                <button title="No OctoPrint plugin updates available" id="octoprintPluginUpdate-${printer._id}" class='tag btn btn-secondary btn-sm bg-colour-2' disabled><i class="fas fa-plug"></i></button>
        </td>
        <td class="align-middle">
            <small>
                <span data-title="${printer.hostState.desc}" id="hostBadge-${printer._id}" class="tag badge badge-${printer.hostState.colour.name} badge-pill">
                    ${printer.hostState.state}
                </span>
            </small>
        </td>
        <td class="align-middle">
            <small>
                <span data-title="${printer.printerState.desc}" id="printerBadge-${printer._id}" class="tag badge badge-${printer.printerState.colour.name} badge-pill">
                    ${printer.printerState.state}
                </span>
            </small>
        </td>
        <td class="align-middle">
            <small>
                <span data-title="${printer.webSocketState.desc}" id="webSocketIcon-${printer._id}" class="tag badge badge-${printer.webSocketState.colour} badge-pill">
                    <i  class="fas fa-plug"></i>
                </span>
            </small>
        </td>
        <td class="align-middle" id="printerGroup-${printer._id}"></td>
        <td class="align-middle" id="printerPrinterInformation-${printer._id}"></td>
        <td class="align-middle" id="printerOctoPrintInformation-${printer._id}"></td>
    </tr>
    `;
}
