import {Test, TestingModule} from '@nestjs/testing';
import * as request from 'supertest';
import {AppModule} from "../../src/app.module";
import {NestExpressApplication} from "@nestjs/platform-express";
import {E2eTestModule} from "../base/e2e-test.module";

describe('PrintersController (e2e)', () => {
    let app: NestExpressApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                E2eTestModule,
                AppModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication<NestExpressApplication>();
        app.setViewEngine('ejs');
        app.setBaseViewsDir('./views');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/printers (GET)', () => {
        return request(app.getHttpServer())
            .get('/printers')
            .expect(200);
    });
});
