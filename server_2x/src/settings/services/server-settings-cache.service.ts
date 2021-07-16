import {Injectable} from "@nestjs/common";
import {ServerSettings} from "../entities/server-settings.entity";
import {ServerSettingsService} from "./server-settings.service";

@Injectable()
export class ServerSettingsCacheService {
    public serverSettings: ServerSettings;

    constructor(
        private serverSettingsService: ServerSettingsService
    ) {
    }

    async initCache() {
        this.serverSettings = await this.serverSettingsService.findFirstOrAdd();
    }

    async getServerSettings() {
        if (!this.serverSettings) {
            await this.initCache();
        }
        return this.serverSettings;
    }
}
