import {Test, TestingModule} from '@nestjs/testing';
import {ErrorLogService} from "./error-log.service";

describe(ErrorLogService.name, () => {
    let service: ErrorLogService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ErrorLogService],
        }).compile();

        service = module.get<ErrorLogService>(ErrorLogService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
