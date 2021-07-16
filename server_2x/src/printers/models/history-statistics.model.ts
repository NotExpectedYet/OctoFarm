import {FixedType} from "../../utils/types/fixed.type";
import {ApexKeyValueModel} from "./apex-key-value.model";

export interface HistoryStatisticsModel {
    completed: number,
    cancelled: number,
    failed: number,
    completedPercent: FixedType,
    cancelledPercent: FixedType,
    failedPercent: FixedType,
    longestPrintTime: FixedType,
    shortestPrintTime: FixedType,
    averagePrintTime: FixedType,
    mostPrintedFile: string,
    printerMost: string,
    printerLoad: string,
    totalFilamentUsage: string,
    averageFilamentUsage: string,
    highestFilamentUsage: string,
    lowestFilamentUsage: string,
    totalSpoolCost: FixedType,
    highestSpoolCost: FixedType,
    totalPrinterCost: FixedType,
    highestPrinterCost: FixedType,
    currentFailed: number,
    totalByDay: ApexKeyValueModel[],
    usageOverTime: ApexKeyValueModel[],
    historyByDay: ApexKeyValueModel[],
}
