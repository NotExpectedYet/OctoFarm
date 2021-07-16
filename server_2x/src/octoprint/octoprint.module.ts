import {HttpModule, Inject, Module} from '@nestjs/common';
import {OctoPrintClientService} from './services/octoprint-client.service';

import {ClientConnectionsState} from "./state/client-connections.state";
import {ConfigModule, ConfigType} from "@nestjs/config";
import {OctoPrintConfig} from "./octoprint.config";
import {WebsocketClientService} from "./services/websocket-client.service";


@Module({
    imports: [
        HttpModule,
        ConfigModule.forFeature(OctoPrintConfig),
    ],
    providers: [
        OctoPrintClientService,
        WebsocketClientService,
        ClientConnectionsState
    ],
    exports: [
        OctoPrintClientService,
        WebsocketClientService
    ]
})
export class OctoprintModule {
    constructor(
        private service: OctoPrintClientService,
        private clientConnectionsState: ClientConnectionsState,
        @Inject(OctoPrintConfig.KEY) private testPrinterConnectionParams: ConfigType<typeof OctoPrintConfig>,
    ) {
    }

    async onModuleInit() {
        if (!!this.testPrinterConnectionParams) {
            await this.clientConnectionsState.initState(this.testPrinterConnectionParams, 'ws');
            await this.clientConnectionsState.testClientConnection();
        }
    }
}
