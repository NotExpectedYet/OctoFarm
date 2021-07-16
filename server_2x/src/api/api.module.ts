import {Module} from '@nestjs/common';
import {ApiService} from './api.service';
import {ApiController} from './api.controller';
import {HealthController} from "./controllers/health.controller";
import {TypeOrmModule} from "@nestjs/typeorm";
import {TerminusModule} from "@nestjs/terminus";
import {LegacyRedirectsController} from "./controllers/legacy-redirects.controller";

@Module({
    imports: [
        TypeOrmModule.forRoot(),
        TerminusModule
    ],
    controllers: [
        ApiController,
        HealthController,
        LegacyRedirectsController
    ],
    providers: [ApiService]
})
export class ApiModule {
}
