import {Test, TestingModule} from '@nestjs/testing';
import {PrinterGroupsController} from './printer-groups.controller';
import {TestProviders} from "../../../test/base/test.provider";
import {PrinterGroupsService} from "../services/printer-groups.service";

describe('PrinterGroupsController', () => {
    let controller: PrinterGroupsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PrinterGroupsController],
            providers: [
                {
                    provide: PrinterGroupsService,
                    useValue: {
                        list: jest.fn(() => [])
                    }
                },
                ...TestProviders
            ]
        }).compile();

        controller = module.get<PrinterGroupsController>(PrinterGroupsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
