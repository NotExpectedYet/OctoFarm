import {HistoryStatisticsModel} from "../models/history-statistics.model";

export interface IHistoryCache {
    initCache: () => void,
    generateStatistics: () => HistoryStatisticsModel,
}
