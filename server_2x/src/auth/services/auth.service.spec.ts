import {Test, TestingModule} from '@nestjs/testing';
import {AuthService} from './auth.service';
import {TestProviders} from "../../../test/base/test.provider";
import {CryptoModule} from "../../crypto/crypto.module";
import {JwtModule} from "@nestjs/jwt";
import {getRepositoryToken} from "@nestjs/typeorm";
import {User} from "../../users/entities/user.entity";
import {UsersService} from "../../users/services/users.service";

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ...TestProviders,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: () => null
                    },
                },
                UsersService,
                AuthService
            ],
            imports: [CryptoModule, JwtModule.register({})]
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
