import {start} from "mongo-unit";
import {JWT_EXPIRES_IN_KEY, JWT_SECRET_KEY} from "../../src/auth/auth.config";

export const e2ePort = parseInt(process.env.TEST_DB_PORT,10) || 27017;
export default async () => {
    console.log('DB warmup');
    process.env[JWT_SECRET_KEY] = "testenvironmentv11.1.1";
    process.env[JWT_EXPIRES_IN_KEY] = "120";
    const dbURL = await start({
        port: e2ePort
    });
    console.log('DB started', dbURL);
}