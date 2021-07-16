import { DashboardStorage } from "./dashboard.storage";
import "gridstack/dist/gridstack.min.css";
import "gridstack/dist/h5/gridstack-dd-native";
import { GridStack } from "gridstack";

const gridStack = GridStack.init({
  cellHeight: 50,
  float: true
});

/**
 * Load grid with configuration stored by DashboardStorage
 * @returns {Promise<void>}
 */
export async function loadGrid() {
  const dashConfig = DashboardStorage.fetchConfig();

  // TODO phase 2 cleanup
  if (dashConfig !== null && dashConfig.length !== 0) {
    const items = GridStack.Utils.sort(dashConfig);
    gridStack.batchUpdate();
    gridStack.engine.nodes.forEach(function (node) {
      const item = items.find(function (e) {
        return e.id === node.id;
      });
      if (!!item) {
        gridStack.update(node.el, {
          x: item.x,
          y: item.y,
          w: item.width,
          h: item.height
        });
      }
    });
    gridStack.commit();
  }
}

/**
 * Bind graph change to callback, saving configuration beforehand
 * @param cb
 */
export function bindGraphChangeUpdate(cb) {
  gridStack.on("change", async function (event, items) {
    DashboardStorage.saveGridStackConfig(gridStack);
    await cb(event, items);
  });
}

/**
 * Optional functionality which can be bound to a button or dialog
 */
export function saveGridStackConfigExplicitly() {
  DashboardStorage.saveGridStackConfig(gridStack);
}
