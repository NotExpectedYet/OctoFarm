import {Test, TestingModule} from '@nestjs/testing';
import {OctoPrintClientService} from './octoprint-client.service';
import {HttpModule} from "@nestjs/common";

describe(OctoPrintClientService.name, () => {
    let service: OctoPrintClientService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [OctoPrintClientService],
            imports: [HttpModule]
        }).compile();

        service = module.get<OctoPrintClientService>(OctoPrintClientService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
