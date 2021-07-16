import {Test, TestingModule} from '@nestjs/testing';
import {ApiController} from './api.controller';
import {ApiService} from './api.service';
import {Connection} from "typeorm";

describe('ApiController', () => {
    let controller: ApiController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ApiController],
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

        controller = module.get<ApiController>(ApiController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
