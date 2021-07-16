import {ObjectID} from "typeorm";
import {FixedType} from "../../utils/types/fixed.type";
import {HistoryFileModel} from "./history-file.model";
import {SpoolModel} from "./spool.model";
import {JobAnalysisModel} from "./job-analysis.model";

export interface HistoryCacheItemModel {
    id: ObjectID,
    index: number,
    // TODO success: printHistory.success, // Proposal to avoid parsing html again
    state: string,
    printer: string,
    file: HistoryFileModel,
    startDate: string,
    endDate: string,
    printTime: number,
    notes: string,
    printerCost?: FixedType,
    spools: SpoolModel[],
    thumbnail: string,
    job: JobAnalysisModel,
    spoolCost: number,
    totalVolume: number,
    totalLength: number,
    totalWeight: number,
    resend?: number,
    snapshot?: any,
    timelapse?: any,
    totalCost?: FixedType,
    costPerHour?: FixedType,
    printHours?: string
}
