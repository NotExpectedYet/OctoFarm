import {NestFactory} from "@nestjs/core";
import {OctoprintWebsocketMockModule} from "./octoprint-websocket-mock.module";
import {WsAdapter} from "@nestjs/platform-ws";
import {Logger} from "@nestjs/common";
import {D, Y} from "../../src/utils/logging.util";
import {APP_HOST, APP_PORT} from "./octoprint-websocket-mock.constants";


const logger = new Logger("OctoPrint-WS-mock");

function printPostBootMessage(logger: Logger) {
    logger.log(`Server is listening on http://${APP_HOST}:${APP_PORT}`);
    logger.log(`${Y}Happy testing!${D}`);
}

async function bootstrap() {
    const app = await NestFactory.create(OctoprintWebsocketMockModule);
    app.useWebSocketAdapter(new WsAdapter(app));
    await app.listen(APP_PORT, APP_HOST, async () => {
        await printPostBootMessage(logger);
    });
}

bootstrap();