import {registerAs} from "@nestjs/config";
import {Logger} from "@nestjs/common";

export const JWT_OPTIONS = 'JWT_MODULE_OPTIONS';
export const JWT_EXPIRES_IN_KEY = 'JWT_EXPIRES_IN';
export const JWT_SECRET_KEY = 'JWT_SECRET';

const logger = new Logger('AuthConfiguration');

export const AuthConfig = registerAs(JWT_OPTIONS, () => {
    if (!process.env[JWT_SECRET_KEY]) {
        throw new Error(`Please configure '${JWT_SECRET_KEY}' environment variable as a strong secret string and restart.`);
    }

    let parsedExpirySeconds = parseInt(process.env[JWT_EXPIRES_IN_KEY], 10);
    if (!parsedExpirySeconds || parsedExpirySeconds < 60) {
        logger.error(`Please properly configure '${JWT_EXPIRES_IN_KEY}' as a number in seconds >60 and restart. Defaulting to 60 seconds.`);
        parsedExpirySeconds = 60;
    }
    return {
        secret: process.env[JWT_SECRET_KEY],
        expiresIn: parsedExpirySeconds
    }
});

export const DefaultAdminPassword = "PleasePrintMeAnOctopus";