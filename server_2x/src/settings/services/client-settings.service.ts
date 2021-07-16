import {Injectable, Logger} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {ClientSettings} from "../entities/client-settings.entity";
import {ClientDashboardSettings} from "../models/client-dashboard/client-dashboard.settings";

@Injectable()
export class ClientSettingsService {
    private readonly logger = new Logger(ClientSettingsService.name);

    constructor(
        @InjectRepository(ClientSettings) private clientSettingsRepository: Repository<ClientSettings>,
    ) {
    }

    async findFirstOrAdd(): Promise<ClientSettings> {
        const clientSettings = await this.clientSettingsRepository.findOne();
        if (!!clientSettings) {
            return clientSettings;
        } else {
            this.logger.warn("Created ServerSettings by default as it was not provided");
            return await this.clientSettingsRepository.save(new ClientSettings({
                // TODO expand model
                dashboard: new ClientDashboardSettings()
            }));
        }
    }

    async getOrAddDashboardSettings() {
        return await this.findFirstOrAdd();
    }
}