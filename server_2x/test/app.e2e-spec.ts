import {Test, TestingModule} from '@nestjs/testing';
import * as request from 'supertest';
import {AppModule} from '../src/app.module';
import {E2eTestModule} from "./base/e2e-test.module";
import {NestExpressApplication} from "@nestjs/platform-express";


describe('AppController (e2e)', () => {
    let app: NestExpressApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                E2eTestModule,
                AppModule
            ],
        }).compile();

        app = moduleFixture.createNestApplication<NestExpressApplication>();
        app.setViewEngine('ejs');
        app.setBaseViewsDir('../views');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/ (GET) - redirect to login', () => {
        return request(app.getHttpServer())
            .get('/')
            .expect(302)
            .expect('Location', /auth\/login/);
    });

    it('/health (GET)', () => {
        return request(app.getHttpServer())
            .get('/health')
            .expect(200)
            .then(result => {
                expect(result.body).toHaveProperty('status', 'ok');
            });
    });

    it('/printer-groups/list (GET)', () => {
        return request(app.getHttpServer())
            .get('/printer-groups/list')
            .expect(200)
            .then(result => {
                // expect(result.body).toHaveProperty('status', 'ok');
            });
    });
});
