import {Module} from "@nestjs/common";
import {PrintersModule} from "../printers/printers.module";
import {DashboardMvcController} from "./controller/dashboard-mvc.controller";
import {SettingsModule} from "../settings/settings.module";
import {ConfigModule} from "@nestjs/config";
import {DashboardConfig} from "./dashboard.config";

@Module({
    imports: [
        ConfigModule.forFeature(DashboardConfig),
        PrintersModule,
        SettingsModule
    ],
    controllers: [DashboardMvcController]
})
export class DashboardModule {

}