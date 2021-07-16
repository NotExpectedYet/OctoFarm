import {Module} from '@nestjs/common';
import {MonitoringMvcController} from './controllers/monitoring-mvc.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Alert} from "./entities/alert.entity";
import {ErrorLog} from "./entities/error-log.entity";
import {FarmStatistics} from "./entities/farm-statistics.entity";
import {ErrorLogService} from "./services/error-log.service";
import {ErrorLogController} from "./controllers/error-log.controller";
import {FarmStatisticsService} from "./services/farm-statistics.service";
import {FarmStatisticsController} from "./controllers/farm-statistics.controller";
import {AlertsController} from "./controllers/alerts.controller";
import {AlertsService} from "./services/alerts.service";
import {ConfigModule} from "@nestjs/config";
import {MonitoringConfig} from "./monitoring.config";
import {SettingsModule} from "../settings/settings.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Alert, ErrorLog, FarmStatistics]),
        ConfigModule.forFeature(MonitoringConfig),
        SettingsModule
    ],
    controllers: [
        MonitoringMvcController,
        ErrorLogController,
        FarmStatisticsController,
        AlertsController
    ],
    providers: [
        ErrorLogService,
        FarmStatisticsService,
        AlertsService,
    ]
})
export class MonitoringModule {
}
