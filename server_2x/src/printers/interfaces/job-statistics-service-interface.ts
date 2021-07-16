import {JobStatisticsModel} from "../models/job-statistics.model";

export interface IJobStatisticsService {
  generate: (printer: any, filament: any) => Promise<void>;
}
