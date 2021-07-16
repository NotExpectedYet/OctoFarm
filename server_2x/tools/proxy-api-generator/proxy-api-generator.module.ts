import {HttpModule, Logger, Module} from "@nestjs/common";
import {APP_FILTER} from "@nestjs/core";
import {ExceptionsLoggerFilter} from "../../src/providers/exception.filters";
import {ConfigModule} from "@nestjs/config";
import {OctoprintModule} from "../../src/octoprint/octoprint.module";
import {BootController} from "../../src/boot/boot.controller";
import {ProxyApiGeneratorService} from "./proxy-api-generator.service";
import {OctoPrintConfig} from "../../src/octoprint/octoprint.config";

@Module({
    providers: [
        {
            provide: APP_FILTER,
            useClass: ExceptionsLoggerFilter,
        },
        ProxyApiGeneratorService
    ],
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [".env", ".env.development", ".env.production"],
        }),
        ConfigModule.forFeature(OctoPrintConfig),
        OctoprintModule,
        HttpModule
    ],
    controllers: [BootController]
})
export class ProxyApiGeneratorModule {
    private readonly logger = new Logger(ProxyApiGeneratorModule.name);

    constructor(
        private apiGenerator: ProxyApiGeneratorService
    ) {

    }

    async onModuleInit() {
        await this.apiGenerator.generateSchemas("tools/proxy-generated/");
    }
}
