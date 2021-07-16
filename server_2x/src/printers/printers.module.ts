import {Module} from "@nestjs/common";
import {PrintersController} from "./controllers/printers.controller";
import {PrintersService} from "./services/printers.service";
import {Printer} from "./entities/printer.entity";
import {TypeOrmModule} from "@nestjs/typeorm";
import {PrintersMvcController} from "./controllers/printers-mvc.controller";
import {SettingsModule} from "../settings/settings.module";
import {PrinterGroupsController} from './controllers/printer-groups.controller';
import {PrinterGroupsService} from './services/printer-groups.service';
import {PrinterGroup} from "./entities/printer-group.entity";
import {ConfigModule} from "@nestjs/config";
import {PrintersConfig} from "./printers.config";
import {PrinterProfile} from "./entities/printer-profile.entity";
import {PrinterRoomData} from "./entities/printer-room-data.entity";
import {PrinterTempHistory} from "./entities/printer-temp-history.entity";
import {PrinterQueryTask} from "./tasks/printer-query.task";
import {HistoryCacheService} from "./services/history-cache.service";
import {HistoryService} from "./services/history.service";
import {PrinterHistory} from "./entities/printer-history.entity";
import {HistoryCache} from "./services/history.cache";
import {JobStatisticsService} from "./services/job-statistics.service";

@Module({
    imports: [
        ConfigModule.forFeature(PrintersConfig),
        TypeOrmModule.forFeature([
            Printer,
            PrinterGroup,
            PrinterHistory,
            PrinterProfile,
            PrinterRoomData,
            PrinterTempHistory
        ]),
        SettingsModule,
    ],
    providers: [
        PrintersService,
        HistoryCache,
        HistoryCacheService,
        HistoryService,
        JobStatisticsService,
        PrinterGroupsService,
        PrinterQueryTask
    ],
    exports: [
        PrintersService,
        HistoryCacheService,
        JobStatisticsService
    ],
    controllers: [
        PrintersController,
        PrintersMvcController,
        PrinterGroupsController
    ]
})
export class PrintersModule {
}
