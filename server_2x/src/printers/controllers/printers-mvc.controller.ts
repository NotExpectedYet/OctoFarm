import {Body, Controller, Get, Inject, Post, Req, Res, Sse} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {PrintersService} from "../services/printers.service";
import {Public} from "../../utils/auth.decorators";
import {ServerSettingsService} from "../../settings/services/server-settings.service";
import {prettyHelpers} from "../../dashboard/js/pretty";
import {interval, Observable} from "rxjs";
import {map} from "rxjs/operators";
import {stringify} from "flatted";
import {PrintersSseMessageDto} from "../dto/printers-sse-message.dto";
import {ConfigType} from "@nestjs/config";
import {PrintersConfig, UpdateEventStreamPeriodDefault} from "../printers.config";
import {CreateMultiplePrintersDtot} from "../dto/create-multiple-printers.dtot";

@Controller("printers")
@Public()
@ApiTags(PrintersMvcController.name)
export class PrintersMvcController {
    readonly ssePeriod: number;

    constructor(
        private printersService: PrintersService,
        private serverSettingsService: ServerSettingsService,
        @Inject(PrintersConfig.KEY) private printersOptions: ConfigType<typeof PrintersConfig>,
    ) {
        this.ssePeriod = this.printersOptions?.updateEventStreamPeriod || UpdateEventStreamPeriodDefault;
    }

    // ======= LEGACY MVC ENDPOINTS BELOW - PHASED OUT SOON ======
    @Get()
    async getPrinters(@Req() req, @Res() res) {
        const printers = await this.printersService.list();
        const serverSettings = await this.serverSettingsService.findFirstOrAdd();
        let user = null;
        let group = null;
        if (serverSettings.server.loginRequired === false) {
            user = "No User";
            group = "Administrator";
        } else {
            user = req.user?.name;
            group = req.user?.group;
        }
        res.render("printerManagement", {
            octoFarmPageTitle: "Taitel",
            name: user,
            userGroup: group || "Administrator",
            version: process.env.npm_package_version,
            page: "Printer Manager",
            printerCount: printers.length,
            helpers: prettyHelpers,
        });
    }

    @Sse("update-sse")
    async updatePrinters(): Promise<Observable<string | PrintersSseMessageDto>> {
        // TODO NotExpectedYet oi mate it's all you's 'ere!
        const printers = await this.printersService.list();
        // const printersInformation = await PrinterClean.returnPrintersInformation();
        // const printerControlList = await PrinterClean.returnPrinterControlList();
        // const currentTickerList = await PrinterTicker.returnIssue();

        const returnedUpdate: PrintersSseMessageDto = {
            printersInformation: printers,
            printerControlList: null,
            currentTickerList: null,
        }
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

    @Post("add")
    @Public()
    async addPrinter(@Body() input: CreateMultiplePrintersDtot) {
        await this.printersService.createMultiple(input);
    }

    @Post("printerInfo")
    @Public()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getPrinterInfo(@Req() req, @Res() res) {
        // const id = req.body.i;
        //
        // const printers = await PrinterClean.returnPrintersInformation();
        // if (typeof id === "undefined" || id === null) {
        //     res.send(printers);
        // } else {
        //     const index = _.findIndex(printers, function (o) {
        //         return o._id == id;
        //     });
        //     const returnPrinter = {
        //         printerName: printers[index].printerName,
        //         apikey: printers[index].apikey,
        //         _id: printers[index]._id,
        //         printerURL: printers[index].printerURL,
        //         storage: printers[index].storage,
        //         fileList: printers[index].fileList,
        //         systemChecks: printers[index].systemChecks,
        //     };
        //     res.send(returnPrinter);
    }
}
