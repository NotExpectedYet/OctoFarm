import {Test, TestingModule} from '@nestjs/testing';
import {UsersController} from './users.controller';
import {UsersService} from '../services/users.service';
import {CryptoModule} from "../../crypto/crypto.module";
import {TestProviders} from "../../../test/base/test.provider";
import {getRepositoryToken} from "@nestjs/typeorm";
import {User} from "../entities/user.entity";

describe('UsersController', () => {
    let controller: UsersController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                ...TestProviders,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: () => null
                    },
                },
                UsersService,
            ],
            imports: [CryptoModule]
        }).compile();

        controller = module.get<UsersController>(UsersController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
