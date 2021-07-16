import {Controller, Inject, Sse} from '@nestjs/common';
import {ApiTags} from "@nestjs/swagger";
import {interval, Observable} from "rxjs";
import {PrintersSseMessageDto} from "../../printers/dto/printers-sse-message.dto";
import {map} from "rxjs/operators";
import {stringify} from "flatted";
import {ServerSettingsService} from "../../settings/services/server-settings.service";
import {ConfigType} from "@nestjs/config";
import {ClientSettingsService} from "../../settings/services/client-settings.service";
import {MonitoringConfig, UpdateEventStreamPeriodDefault} from "../monitoring.config";

@Controller('monitoring')
@ApiTags(MonitoringMvcController.name)
export class MonitoringMvcController {
    readonly ssePeriod: number;

    constructor(
        private serverSettingsService: ServerSettingsService,
        private clientSettingsService: ClientSettingsService,
        @Inject(MonitoringConfig.KEY) private printersOptions: ConfigType<typeof MonitoringConfig>,
    ) {
        this.ssePeriod = this.printersOptions?.updateEventStreamPeriod || UpdateEventStreamPeriodDefault;
    }

    @Sse("update-sse")
    async updatePrinters(): Promise<Observable<string | PrintersSseMessageDto>> {
        // TODO NotExpectedYet oi mate it's all you's 'ere!
        // const currentOperations = await PrinterClean.returnCurrentOperations();
        //
        // let printersInformation = await PrinterClean.returnPrintersInformation();
        //
        // printersInformation = await filterMe(printersInformation);
        // printersInformation = await sortMe(printersInformation);
        // const printerControlList = await PrinterClean.returnPrinterControlList();
        // let clientSettings = await SettingsClean.returnClientSettings();
        // if (typeof clientSettings === "undefined") {
        //     await SettingsClean.start();
        //     clientSettings = await SettingsClean.returnClientSettings();
        // }
        //
        // let serverSettings = await SettingsClean.returnSystemSettings();
        // if (typeof serverSettings === "undefined") {
        //     await SettingsClean.start();
        //     serverSettings = await SettingsClean.returnSystemSettings();
        // }
        // if (serverSettings.influxExport.active) {
        //     if (influxCounter >= 2000) {
        //         sendToInflux(printersInformation);
        //         influxCounter = 0;
        //     } else {
        //         influxCounter = influxCounter + 500;
        //     }
        //     // eslint-disable-next-line no-use-before-define
        // }
        // const infoDrop = {
        //     printersInformation: printersInformation,
        //     currentOperations: currentOperations,
        //     printerControlList: printerControlList,
        //     clientSettings: clientSettings,
        // };
        return interval(this.ssePeriod)
            .pipe(
                map(() => {
                        // TODO NotExpectedYet oi mate it's all you's 'ere!
                        // Do we really need flattening? I think we should focus on serialization-first models
                        return stringify(null);
                    }
                )
            );
    }
}
