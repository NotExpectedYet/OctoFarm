import {Controller, Get} from "@nestjs/common";
import {HealthCheck, HealthCheckService, TypeOrmHealthIndicator} from "@nestjs/terminus";
import {Public} from "../../utils/auth.decorators";
import {ApiTags} from "@nestjs/swagger";

@Controller('health')
@ApiTags(HealthController.name)
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: TypeOrmHealthIndicator,
    ) {
    }

    @Get()
    @Public()
    @HealthCheck()
    readiness() {
        return this.health.check([
            async () => this.db.pingCheck('database', {timeout: 300}),
        ]);
    }
}