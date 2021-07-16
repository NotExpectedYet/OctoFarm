import {registerAs} from "@nestjs/config";
import {DashboardConfigurationModel} from "./models/dashboard-configuration.model";

export const DASHBOARD_OPTIONS = 'DASHBOARD_MODULE_OPTIONS';
export const DASHBOARD_UPDATE_PERIOD = 'DASHBOARD_UPDATE_PERIOD';
export const UpdateEventStreamPeriodDefault = 5000;

export const DashboardConfig = registerAs(DASHBOARD_OPTIONS, (): DashboardConfigurationModel => {
    const updateEventStreamPeriod = parseInt(process.env[DASHBOARD_UPDATE_PERIOD], 10) || UpdateEventStreamPeriodDefault;
    return {
        updateEventStreamPeriod
    }
});