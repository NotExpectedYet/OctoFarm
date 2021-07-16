"use strict";

const FarmStatistics = require("../models/FarmStatistics");

/**
 * Lists saved farm statistics in the database.
 * @param filter {((err: *, docs: Document[]) => void)|({_id?: [Extract<DocumentDefinition<Document<*, {}>>["_id"], ObjectId>] extends [never] ? Condition<DocumentDefinition<Document<*, {}>>["_id"]> : Condition<DocumentDefinition<Document<*, {}>>["_id"] | string | {_id: ObjectId}>; __v?: [Extract<DocumentDefinition<Document<*, {}>>["__v"], ObjectId>] extends [never] ? Condition<DocumentDefinition<Document<*, {}>>["__v"]> : Condition<DocumentDefinition<Document<*, {}>>["__v"] | string>; id?: [Extract<DocumentDefinition<Document<*, {}>>["id"], ObjectId>] extends [never] ? Condition<DocumentDefinition<Document<*, {}>>["id"]> : Condition<DocumentDefinition<Document<*, {}>>["id"] | string>} & RootQuerySelector<DocumentDefinition<Document<*, {}>>>)}
 */
const list = async (filter) => {
  return FarmStatistics.find(filter);
};

/**
 * Initiate farm information entry for a certain date
 * @param startDate
 * @param heatmapArray
 * @returns {Promise<Document>}
 */
const create = async (startDate, heatmapArray) => {
  const newfarmStatisticsEntry = new FarmStatistics({
    farmStart: startDate,
    heatMap: heatmapArray
  });

  await newfarmStatisticsEntry.save();

  return newfarmStatisticsEntry;
};

module.exports = {
  list,
  create
};
