import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {TestProviders} from "./test.provider";
import {e2ePort} from "./test-setup.global";

console.log("E2E Looking up db at port", e2ePort);

@Module({
    imports: [
        TypeOrmModule.forRoot({
                type: 'mongodb',
                useUnifiedTopology: true,
                port: e2ePort,
                entities: ["./src/**/*.entity{.ts,.js}"],
                database: 'test',
                synchronize: true,
            }
        ),
    ],
    providers: [
        ...TestProviders
    ],
    exports: [
        TypeOrmModule,
        ...TestProviders
    ]
})
export class E2eTestModule {

}