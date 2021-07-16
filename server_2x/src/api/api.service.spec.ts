import {Test, TestingModule} from '@nestjs/testing';
import {ApiService} from './api.service';
import {Connection} from "typeorm";

describe('ApiService', () => {
    let service: ApiService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApiService,
                {
                    provide: Connection,
                    useValue: {
                        isConnected: false
                    }
                }
            ],
        }).compile();

        service = module.get<ApiService>(ApiService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
