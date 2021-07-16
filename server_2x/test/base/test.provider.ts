import {Provider} from "@nestjs/common";
import {AuthConfig} from "../../src/auth/auth.config";
import {JwtOptions} from "../../src/auth/interfaces/jwt-options.model";

export const TestProviders: Provider<any>[] = [
    {
        provide: AuthConfig.KEY,
        useValue: {
            secret: 'TotallySafeTest',
            expiresIn: 120
        } as JwtOptions
    }
]