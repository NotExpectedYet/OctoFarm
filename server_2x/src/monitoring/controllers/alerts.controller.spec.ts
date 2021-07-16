import {Test, TestingModule} from '@nestjs/testing';
import {AlertsController} from "./alerts.controller";
import {AlertsService} from "../services/alerts.service";

describe(AlertsController.name, () => {
    let controller: AlertsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AlertsController],
            providers: [AlertsService],
        }).compile();

        controller = module.get<AlertsController>(AlertsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
