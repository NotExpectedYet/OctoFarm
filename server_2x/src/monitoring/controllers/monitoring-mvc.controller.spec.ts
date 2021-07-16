import {Test, TestingModule} from '@nestjs/testing';
import {MonitoringMvcController} from './monitoring-mvc.controller';
import {ServerSettingsService} from "../../settings/services/server-settings.service";
import {ClientSettingsService} from "../../settings/services/client-settings.service";
import {MonitoringConfig} from "../monitoring.config";

describe(MonitoringMvcController.name, () => {
    let controller: MonitoringMvcController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MonitoringMvcController],
            providers: [{
                provide: ServerSettingsService,
                useValue: null
            }, {
                provide: ClientSettingsService,
                useValue: null
            }, {
                provide: MonitoringConfig.KEY,
                useValue: null
            }],
        }).compile();

        controller = module.get<MonitoringMvcController>(MonitoringMvcController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
