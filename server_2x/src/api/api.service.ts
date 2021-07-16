import {Injectable} from '@nestjs/common';
import {Connection} from "typeorm";
import {InjectConnection} from "@nestjs/typeorm";

@Injectable()
export class ApiService {
    public static databaseStartupErrorOccurred = false;
    constructor(
        @InjectConnection() private readonly connection: Connection
    ) {
    }

    isDatabaseConnected(): boolean {
        return this.connection.isConnected;
    }
}
