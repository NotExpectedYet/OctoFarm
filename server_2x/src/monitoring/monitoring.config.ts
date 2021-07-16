import {registerAs} from "@nestjs/config";
import {MonitoringConfigurationModel} from "./models/monitoring-configuration.model";

export const MONITORING_OPTIONS = 'MONITORING_MODULE_OPTIONS';
export const MONITORING_UPDATE_PERIOD = 'MONITORING_UPDATE_PERIOD';
export const UpdateEventStreamPeriodDefault = 500;

export const MonitoringConfig = registerAs(MONITORING_OPTIONS, (): MonitoringConfigurationModel => {
    const updateEventStreamPeriod = parseInt(process.env[MONITORING_UPDATE_PERIOD], 10) || UpdateEventStreamPeriodDefault;
    return {
        updateEventStreamPeriod
    }
});