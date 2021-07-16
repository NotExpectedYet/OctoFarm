import {Module} from "@nestjs/common";
import {BootController} from "./boot/boot.controller";
import { OctoprintModule } from './octoprint/octoprint.module';

// A safety module in case of startup errors
@Module({
    // imports: [
    // Serve client
    // ServeStaticModule.forRoot({
    //     rootPath: join(__dirname, '..', 'client'),
    // }),
    // ],
    controllers: [BootController]
})
export class FallbackModule {
}