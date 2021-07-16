import {
  massDragAndDropId,
  massDragAndDropStatusId
} from "./printer-map.options";

export function constructMassDragAndDropPanelHTML() {
  return `
  <div class="col-12">
    <div class="card" id="${massDragAndDropId}">
      <div class="card-header dashHeader">
        <strong>Drag a file here to mass print</strong>
      </div>
      <div class="card-body pt-1 pb-0 pl-2 pr-2">
        <div id="${massDragAndDropStatusId}">
          <span class="badge badge-danger">0 selected</span> select a printer first to mass-upload.
        </div>
      </div>
    </div>
  </div>
  `;
}
