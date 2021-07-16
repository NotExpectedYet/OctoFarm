export interface HistoricalModel {
    // Defined generally
    weeklyUtilisation: boolean,
    hourlyTotalTemperatures: boolean,
    environmentalHistory: boolean,
    // Defined by dashboard
    filamentUsageOverTime: boolean,
    filamentUsageByDay: boolean,
    historyCompletionByDay: boolean,
}