import {HttpModule, Inject, Logger, Module} from "@nestjs/common";
import {APP_FILTER} from "@nestjs/core";
import {ExceptionsLoggerFilter} from "../../src/providers/exception.filters";
import {ConfigModule, ConfigType} from "@nestjs/config";
import {OctoprintGateway} from "./gateway/octoprint.gateway";
import {TestClientController} from "./controllers/test-client.controller";
import {OctoPrintClientService} from "../../src/octoprint/services/octoprint-client.service";
import {OctoPrintConfig} from "../../src/octoprint/octoprint.config";
import {ClientConnectionsState} from "../../src/octoprint/state/client-connections.state";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [".env", ".env.development", ".env.production"],
        }),
        ConfigModule.forFeature(OctoPrintConfig),
        HttpModule
    ],
    providers: [
        {
            provide: APP_FILTER,
            useClass: ExceptionsLoggerFilter,
        },
        OctoprintGateway,
        OctoPrintClientService,
        ClientConnectionsState
    ],
    controllers: [TestClientController]
})
export class OctoprintWebsocketMockModule {
    private readonly logger = new Logger(OctoprintWebsocketMockModule.name);

    constructor(
        @Inject(OctoPrintConfig.KEY) private testPrinterConnectionParams: ConfigType<typeof OctoPrintConfig>,
        private octoprintClient: OctoPrintClientService,
        private clientConnectionsState: ClientConnectionsState,
        private octoprintGateway: OctoprintGateway
    ) {
    }

    async onModuleInit() {
        await this.clientConnectionsState.initState(this.testPrinterConnectionParams, 'ws');
        await this.clientConnectionsState.testClientConnection(this.octoprintGateway);
    }

    proxyOctoPrintToBroadcast(message: any) {
        this.octoprintGateway.handleBroadcastEvent(message);
    }
}
