import {Controller, Get, Inject, Req, Res, Sse} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {Public} from "../../utils/auth.decorators";
import {ClientSettingsService} from "../../settings/services/client-settings.service";
import {PrintersService} from "../../printers/services/printers.service";
import {ServerSettingsService} from "../../settings/services/server-settings.service";
import {prettyHelpers} from "../js/pretty";
import {interval, Observable} from "rxjs";
import {map} from "rxjs/operators";
import {ConfigType} from "@nestjs/config";
import {DashboardConfig, UpdateEventStreamPeriodDefault} from "../dashboard.config";
import {DashboardSseMessageDto} from "../dto/sse-message.dto";
import {stringify} from "flatted";

@Controller("dashboard")
@ApiTags(DashboardMvcController.name)
export class DashboardMvcController {
    readonly ssePeriod: number;

    constructor(
        private clientSettingsService: ClientSettingsService,
        private serverSettingsService: ServerSettingsService,
        private printersService: PrintersService,
        @Inject(DashboardConfig.KEY) private dashboardOptions: ConfigType<typeof DashboardConfig>,
    ) {
        this.ssePeriod = this.dashboardOptions?.updateEventStreamPeriod || UpdateEventStreamPeriodDefault;
    }

    @Sse("update-sse")
    @Public()
    async updateDashboard(): Promise<Observable<string>> {
        // TODO NotExpectedYet oi mate it's all you's 'ere!
        // const currentOperations = await PrinterClean.returnCurrentOperations();
        // const dashStatistics = await PrinterClean.returnDashboardStatistics();
        // const printerInformation = await PrinterClean.returnPrintersInformation();
        const clientSettings = await this.clientSettingsService.getOrAddDashboardSettings();

        const returnedUpdate: DashboardSseMessageDto = {
            printerInformation: null,
            currentOperations: null,
            dashStatistic: null,
            dashboardSettings: clientSettings.dashboard,
        };
        return interval(this.ssePeriod)
            .pipe(
                map(() => {
                        // TODO NotExpectedYet oi mate it's all you's 'ere!
                        // Do we really need flattening? I think we should focus on serialization-first models
                        return stringify(returnedUpdate);
                    }
                )
            );
    }

    @Get()
    @Public()
    async getDashboard(@Req() req, @Res() res) {
        const clientSettings = await this.clientSettingsService.getOrAddDashboardSettings();
        const serverSettings = await this.serverSettingsService.findFirstOrAdd();
        const printers = await this.printersService.list();

        // TODO NotExpectedYet oi mate it's all you's 'ere!
        // const dashStatistics = await PrinterClean.returnDashboardStatistics();

        let user = null;
        let group = null;
        if (serverSettings.server.loginRequired === false) {
            user = "No User";
            group = "Administrator";
        } else {
            user = req.user?.name;
            group = req.user?.group;
        }

        res.render("dashboard", {
            octoFarmPageTitle: "Taitel",
            name: user,
            userGroup: group,
            version: process.env.npm_package_version,
            printerCount: printers.length,
            page: "Dashboard",
            helpers: prettyHelpers,
            dashboardSettings: clientSettings.dashboard,
            // dashboardStatistics: dashStatistics,
        });
    }
}
