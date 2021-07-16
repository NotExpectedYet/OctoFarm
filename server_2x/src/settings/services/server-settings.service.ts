import {Injectable, Logger} from "@nestjs/common";
import {ServerSettings} from "../entities/server-settings.entity";
import {Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";

@Injectable()
export class ServerSettingsService {
    private readonly logger = new Logger(ServerSettingsService.name);

    constructor(
        @InjectRepository(ServerSettings) private serverSettingsRepository: Repository<ServerSettings>,
    ) {

    }

    async findFirstOrAdd(): Promise<ServerSettings> {
        const serverSettings = await this.serverSettingsRepository.findOne();
        if (!!serverSettings) {
            return serverSettings;
        } else {
            this.logger.warn("Created ServerSettings by default as it was not provided");
            return await this.serverSettingsRepository.save(new ServerSettings({
                server: {
                    registration: true,
                    loginRequired: true,
                    port: 4000
                },
                onlinePolling: {}
            }));
        }
    }
}