import OctoFarmClient from "../../lib/octofarm_client";
import Sortable from "../../vendor/sortable";

export function setupSortablePrintersTable() {
  // Setup drag and drop re-ordering listeners
  const el = document.getElementById("printerList");
  const sortable = Sortable.create(el, {
    handle: ".sortableList",
    animation: 150,
    onUpdate(/** Event */ e) {
      const elements = e.target.querySelectorAll("[id^='printerCard-']");
      const listID = [];
      elements.forEach((e) => {
        const ca = e.id.split("-");
        listID.push(ca[1]);
      });
      try {
        OctoFarmClient.post("printers/updateSortIndex", listID);
      } catch (e) {
        console.error(e);
        UI.createAlert(
          "error",
          "Couldn't update sorted index, please check the logs",
          3000,
          "clicked"
        );
      }
    }
  });
}
