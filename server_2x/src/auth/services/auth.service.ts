import {Inject, Injectable, Logger, UnauthorizedException} from "@nestjs/common";
import {UsersService} from "../../users/services/users.service";
import {LoginUserDto} from "../dto/login-user.dto";
import {CryptoService} from "../../crypto/crypto.service";
import {User} from "../../users/entities/user.entity";
import {JwtService} from "@nestjs/jwt";
import {UserPayload} from "../interfaces/user-payload.model";
import {AuthConfig} from "../auth.config";
import {ConfigType} from "@nestjs/config";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @Inject(AuthConfig.KEY) private jwtOptions: ConfigType<typeof AuthConfig>,
        private readonly cryptoService: CryptoService,
        private readonly usersService: UsersService,
        private jwtService: JwtService
    ) {
    }

    async createToken(loginUserDto: LoginUserDto) {
        const {id, username} = await this.validateLoginUserDto(loginUserDto);
        const {expiresIn} = this.jwtOptions;

        const token = this.jwtService.sign({id, username}, this.jwtOptions);
        return {
            expires_in: expiresIn,
            access_token: token,
        };
    }

    async validateLoginUserDto(loginUserDto: LoginUserDto): Promise<User> {
        const {password, username} = loginUserDto;
        const user = await this.usersService.findOne({username});
        if (!user) {
            throw new UnauthorizedException();
        }
        const isValid = await this.cryptoService.comparePasswordHash(password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException();
        }
        return user;
    }

    async validateTokenClaims(payload: UserPayload): Promise<User> {
        const {username, id} = payload;
        try {
            const user = await this.usersService.findById(id);
            return user.username === username ? user : null;
        } catch {
            return null;
        }
    }

    validateToken(token: string): UserPayload {
        try {
            return this.jwtService.verify<UserPayload>(token, this.jwtOptions);
        } catch {
            return null;
        }
    }
}
