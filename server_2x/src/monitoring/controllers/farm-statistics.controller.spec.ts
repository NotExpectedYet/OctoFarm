import {Test, TestingModule} from '@nestjs/testing';
import {FarmStatisticsController} from "./farm-statistics.controller";
import {FarmStatisticsService} from "../services/farm-statistics.service";

describe(FarmStatisticsController.name, () => {
    let controller: FarmStatisticsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FarmStatisticsController],
            providers: [FarmStatisticsService],
        }).compile();

        controller = module.get<FarmStatisticsController>(FarmStatisticsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
