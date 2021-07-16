const storageKey = "dashboardConfiguration";

export class DashboardStorage {
  /**
   * Fetch the tile configuration from LocalStorage without guarantee
   * @returns {any}
   */
  static fetchConfig() {
    const dashData = localStorage.getItem(storageKey);
    return JSON.parse(dashData);
  }

  /**
   * Save the tile configuration to LocalStorage
   * @param config
   */
  static saveConfig(config) {
    localStorage.setItem(storageKey, JSON.stringify(config));
  }

  /**
   * Convert the Grid Stack to tile configuration and save it
   * @param gridStackInstance
   */
  static saveGridStackConfig(gridStackInstance) {
    const gridStackConfig = [];
    gridStackInstance.engine.nodes.forEach(function (node) {
      gridStackConfig.push({
        x: node.x,
        y: node.y,
        width: node.w,
        height: node.h,
        id: node.id
      });
    });
    localStorage.setItem(storageKey, JSON.stringify(gridStackConfig));
  }
}
