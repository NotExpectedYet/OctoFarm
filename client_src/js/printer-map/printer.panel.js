import { cleanPrinterName } from "./printer-map.utils";
import {
  gutterHalfSize,
  panelPrefix,
  quickActionsButtonIdPrefix,
  quickActionsModalId,
  selectableTilePrefix,
  stopButtonIdPrefix
} from "./printer-map.options";

export function constructPrinterPanelHTML(
  printer,
  realCoord,
  clientSettings,
  isLeftOfGutter,
  isRightOfGutter
) {
  const name = cleanPrinterName(printer);
  const separatorStyle =
    realCoord[1] % 2 === 1
      ? `border-top:2px gray solid;`
      : `border-bottom:2px gray solid;`;
  const gutterStyle = isLeftOfGutter
    ? `style="margin-right:${gutterHalfSize}; margin-left:-${gutterHalfSize}; border-right:2px orange solid; ${separatorStyle}"`
    : isRightOfGutter
    ? `style="margin-right:-${gutterHalfSize}; margin-left:${gutterHalfSize}; border-left:2px orange solid; ${separatorStyle}"`
    : `style="${separatorStyle}"`;
  const stubOrNotClass = !!printer.stub
    ? "printer-map-tile-stub"
    : "printer-map-tile";
  const isIdle = printer.printerState?.colour.category === "Idle";
  const printerStateColor =
    printer.printerState?.colour.category === "Idle"
      ? "Complete"
      : printer.printerState?.colour.category;
  return `
      <div class="col-sm-2 col-md-2 col-lg-2 col-xl-2" id="${panelPrefix}-${
    printer._id
  }" ${gutterStyle}>
        <div class="card mt-1 mb-1 ml-1 mr-1 text-center ${stubOrNotClass} ${printerStateColor}" id="${selectableTilePrefix}-${
    printer._id
  }">
          <div class="card-header ${printerStateColor}" style="padding:5px">
            <span id="name-${
              printer._id
            }" class="badge badge-light float-left">${name}</span>
            <button
              title="Quick actions dialog"
              id="${quickActionsButtonIdPrefix}${printer._id}"
              type="button"
              ${!!printer.stub ? "hidden" : ""}
              class="tag btn btn-secondary mt-1 mb-1 btn-sm float-right"
              data-printer-id="${printer._id}"
              data-toggle="modal" 
              data-target="${quickActionsModalId}" 
              aria-haspopup="true" 
              aria-expanded="false" 
              role="button">
              <i class="fa fa-ellipsis-v"></i>
            </button>
            <button
                title="Stop your current print"
                id="${stopButtonIdPrefix}${printer._id}"
                type="button"
                class="tag btn btn-danger mt-1 mb-1 btn-sm float-right ${
                  !!printer.stub ? "disabled" : ""
                }"
                role="button">
                <i class="fas fa-square"></i>
            </button>
          </div>
          <div class="card-body pt-1 pb-0 pl-2 pr-2">
            <div class="progress">
              <span style="color:white">${isIdle ? "IDLE - " : ""}</span>&nbsp;
              <div
                id="progress-${printer._id}"
                class="progress-bar progress-bar-striped bg-${printerStateColor} percent"
                role="progressbar progress-bar-striped"
                style="width: 0%"
                aria-valuenow="0"
                aria-valuemin="0"
                aria-valuemax="100">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
}
