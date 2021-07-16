import {NestFactory} from "@nestjs/core";
import {ProxyApiGeneratorModule} from "./proxy-api-generator.module";

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(ProxyApiGeneratorModule);
    // application logic...
}

bootstrap();