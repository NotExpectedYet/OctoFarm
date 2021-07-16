import {ClientDashboardSettings} from "../../settings/models/client-dashboard/client-dashboard.settings";

export interface DashboardSseMessageDto {
    printerInformation: any;
    currentOperations: any;
    dashStatistic: any;
    dashboardSettings: ClientDashboardSettings;
}