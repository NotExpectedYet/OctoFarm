const { getEmptyHeatmap } = require("../../constants/cleaner.constants");
const { getDayName } = require("../../utils/time.util");

class HeatMapCache {
  #heatMap = getEmptyHeatmap();
  #arrayTotal = [];
  #heatMapCounter = 17280;

  constructor() {}

  async updateHeatmap() {
    if (this.#heatMapCounter >= 17280) {
      await this.#heatMapping(
        this.#currentOperations.count.complete,
        this.#currentOperations.count.active,
        this.#currentOperations.count.offline,
        this.#currentOperations.count.idle,
        this.#currentOperations.count.disconnected
      );

      this.#heatMapCounter = 0;
    } else {
      this.#heatMapCounter += 1728;
    }
  }

  async initHeatMap() {
    this.#farmStats = await this.#farmStatisticsService.list({});
    if (!this.#farmStats || this.#farmStats.length < 1) {
      this.#farmStats[0] = await this.#farmStatisticsService.create(new Date(), this.#heatMap);
    } else if (!this.#farmStats[0]?.heatMap) {
      // TODO move to a service so it can be mocked - also: this is a one-time runner job to do between database versions
      this.#farmStats[0].heatMap = this.#heatMap;
      this.#dashboardStatistics.utilisationGraph = this.#heatMap;
      this.#farmStats[0].markModified("heatMap");
      await this.#farmStats[0].save();
    }
  }

  /**
   *
   * @param complete
   * @param active
   * @param offline
   * @param idle
   * @param disconnected
   * @returns {Promise<void>}
   */
  async #heatMapping(complete, active, offline, idle, disconnected) {
    // TODO this function is ... in need of a complete redo (run twice, get 2 errors)
    try {
      const today = getDayName();
      const CompleteCount = {
        x: today,
        y: 0,
        figure: 0
      };
      const ActiveCount = {
        x: today,
        y: 0,
        figure: 0
      };

      const IdleCount = {
        x: today,
        y: 0,
        figure: 0
      };
      const OfflineCount = {
        x: today,
        y: 0,
        figure: 0
      };
      const DisconnectedCount = {
        x: today,
        y: 0,
        figure: 0
      };
      if (heatMap[0].data.length === 0) {
        // Created initial data set
        heatMap[0].data.push(CompleteCount);
        heatMap[1].data.push(ActiveCount);
        heatMap[2].data.push(IdleCount);
        heatMap[3].data.push(OfflineCount);
        heatMap[4].data.push(DisconnectedCount);
      } else {
        // Cycle through current data and check if day exists...

        const currentTotal = arrayTotal.reduce((a, b) => a + b, 0);
        for (let i = 0; i < heatMap.length; i++) {
          const lastInArray = heatMap[i].data.length - 1;
          // If x = today add that fucker up!
          if (heatMap[i].data[lastInArray].x === today) {
            if (heatMap[i].name === "Completed") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);

              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + complete;
              arrayTotal[0] = heatMap[i].data[lastInArray].figure;
            }
            if (heatMap[i].name === "Active") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);

              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + active;
              arrayTotal[1] = heatMap[i].data[lastInArray].figure;
            }
            if (heatMap[i].name === "Offline") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);

              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + offline;
              arrayTotal[2] = heatMap[i].data[lastInArray].figure;
            }
            if (heatMap[i].name === "Idle") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);
              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure = heatMap[i].data[lastInArray].figure + idle;
              arrayTotal[3] = heatMap[i].data[lastInArray].figure;
            }
            if (heatMap[i].name === "Disconnected") {
              heatMap[i].data[lastInArray].y = (
                (heatMap[i].data[lastInArray].figure / currentTotal) *
                100
              ).toFixed(3);
              if (!isFinite(heatMap[i].data[lastInArray].y)) {
                heatMap[i].data[lastInArray].y = 0;
              }
              heatMap[i].data[lastInArray].figure =
                heatMap[i].data[lastInArray].figure + disconnected;
              arrayTotal[4] = heatMap[i].data[lastInArray].figure;
            }
          } else {
            // Must be a new day, so shift with new heatMap
            heatMap[0].data.push(CompleteCount);
            heatMap[1].data.push(ActiveCount);
            heatMap[2].data.push(IdleCount);
            heatMap[3].data.push(OfflineCount);
            heatMap[4].data.push(DisconnectedCount);
          }
        }
      }
      // Clean up old days....
      if (heatMap[0].data.length === 8) {
        heatMap[0].data.shift();
        heatMap[1].data.shift();
        heatMap[2].data.shift();
        heatMap[3].data.shift();
        heatMap[4].data.shift();
      }

      // TODO this line throws errors regularly when its not queried yet
      farmStats[0].heatMap = heatMap;
      dashboardStatistics.utilisationGraph = heatMap;
      farmStats[0].markModified("heatMap");
      farmStats[0].save().catch((e) => logger.error(e));
    } catch (e) {
      logger.error("HEAT MAP ISSUE - farmStats[0] is empty", e.message);
    }
  }
}

module.exports = HeatMapCache;
