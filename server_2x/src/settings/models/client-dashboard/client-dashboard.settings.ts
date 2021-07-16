import {FarmActivityModel} from "./farm-activity.model";
import {LayoutModel} from "../layout-settings/layout.model";
import {PrinterStatesModel} from "./printers-states.model";
import {FarmUtilizationModel} from "./farm-utilization.model";
import {HistoricalModel} from "./historical.model";

export class ClientDashboardSettings {
    public defaultLayout: LayoutModel;
    public savedLayout: LayoutModel;
    public farmActivity: FarmActivityModel;
    public printerStates: PrinterStatesModel;
    public farmUtilization: FarmUtilizationModel;
    public historical: HistoricalModel

    constructor(
        // Adjust default with dynamic config
    ) {
        this.defaultLayout = [
            {x: 0, y: 0, width: 2, height: 5, id: "currentUtil"},
            {x: 5, y: 0, width: 3, height: 5, id: "farmUtil"},
            {x: 8, y: 0, width: 2, height: 5, id: "averageTimes"},
            {x: 10, y: 0, width: 2, height: 5, id: "cumulativeTimes"},
            {x: 2, y: 0, width: 3, height: 5, id: "currentStat"},
            {x: 6, y: 5, width: 3, height: 5, id: "printerTemps"},
            {x: 9, y: 5, width: 3, height: 5, id: "printerUtilisation"},
            {x: 0, y: 5, width: 3, height: 5, id: "printerStatus"},
            {x: 3, y: 5, width: 3, height: 5, id: "printerProgress"},
            {x: 6, y: 10, width: 6, height: 9, id: "hourlyTemper"},
            {x: 0, y: 10, width: 6, height: 9, id: "weeklyUtil"},
            {x: 0, y: 19, width: 12, height: 8, id: "enviroData"},
            // TODO defined by dashboard (not by printers view)?
            {x: 0, y: 19, width: 12, height: 8, id: "filamentUsageOverTime"},
            {x: 0, y: 19, width: 12, height: 8, id: "filamentUsageByDay"},
            {x: 0,y: 19,width: 12,height: 8,id: "historyCompletionByDay",},
        ];
        this.savedLayout = [];
        this.farmActivity = {
            currentOperations: false,
            cumulativeTimes: true,
            averageTimes: true,
        };
        this.printerStates = {
            printerState: true,
            printerTemps: true,
            printerUtilisation: true,
            printerProgress: true,
            currentStatus: true,
        }
        this.farmUtilization = {
            currentUtilisation: true,
            farmUtilisation: true,
        };
        this.historical = {
            weeklyUtilisation: true,
            hourlyTotalTemperatures: false,
            environmentalHistory: false,
            // TODO defined by dashboard (not by printers view)?
            filamentUsageOverTime: false,
            filamentUsageByDay: false,
            historyCompletionByDay: false,
        };
    }
}