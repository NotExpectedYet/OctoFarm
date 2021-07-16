import {Test, TestingModule} from '@nestjs/testing';
import {PrinterGroupsService} from './printer-groups.service';
import {TestProviders} from "../../../test/base/test.provider";
import {getRepositoryToken} from "@nestjs/typeorm";
import {PrinterGroup} from "../entities/printer-group.entity";

describe(PrinterGroupsService.name, () => {
    let service: PrinterGroupsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PrinterGroupsService,
                ...TestProviders,
                {
                    provide: getRepositoryToken(PrinterGroup),
                    useValue: {
                        findOne: () => null
                    },
                },
            ]
        }).compile();

        service = module.get<PrinterGroupsService>(PrinterGroupsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
