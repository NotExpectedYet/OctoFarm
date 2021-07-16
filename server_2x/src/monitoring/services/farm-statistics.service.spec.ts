import {Test, TestingModule} from '@nestjs/testing';
import {FarmStatisticsService} from "./farm-statistics.service";

describe(FarmStatisticsService.name, () => {
    let service: FarmStatisticsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [FarmStatisticsService],
        }).compile();

        service = module.get<FarmStatisticsService>(FarmStatisticsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
