const FarmStatistics = require("../models/FarmStatistics");

class FarmStatisticsService {
  /**
   * Lists saved farm statistics in the database.
   */
  async list(filter) {
    return FarmStatistics.find(filter);
  }

  /**
   * Initiate farm information entry for a certain date
   * @param startDate
   * @param heatmapArray
   * @returns {Promise<Document>}
   */
  async create(startDate, heatmapArray) {
    const newfarmStatisticsEntry = new FarmStatistics({
      farmStart: startDate,
      heatMap: heatmapArray
    });

    await newfarmStatisticsEntry.save();

    return newfarmStatisticsEntry;
  }
}

module.exports = FarmStatisticsService;
