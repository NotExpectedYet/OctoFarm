import {Test, TestingModule} from '@nestjs/testing';
import {AlertsService} from "./alerts.service";

describe(AlertsService.name, () => {
    let service: AlertsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AlertsService],
        }).compile();

        service = module.get<AlertsService>(AlertsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
