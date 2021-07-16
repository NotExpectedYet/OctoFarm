import {ExtractJwt, Strategy} from 'passport-jwt';
import {PassportStrategy} from '@nestjs/passport';
import {Inject, Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtOptions} from "../interfaces/jwt-options.model";
import {AuthService} from "../services/auth.service";
import {UserPayload} from "../interfaces/user-payload.model";
import {AuthConfig} from "../auth.config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly authService: AuthService,
        @Inject(AuthConfig.KEY) jwtOptions: JwtOptions,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtOptions.secret,
        });
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async validate(payload: UserPayload, done: Function) {
        const user = await this.authService.validateTokenClaims(payload);
        if (!user) {
            return done(new UnauthorizedException(), false);
        }
        done(null, user);
    }
}