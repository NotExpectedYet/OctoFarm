import {Module, OnModuleInit} from '@nestjs/common';
import {Connection} from 'typeorm';

@Module({})
export class MigrationsModule implements OnModuleInit {
    constructor(private readonly connection: Connection) {
    }

    async onModuleInit() {
        await this.connection.runMigrations();
    }
}