import {
    MessageBody,
    OnGatewayConnection,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse
} from '@nestjs/websockets';
import {Server} from "ws";
import {Logger} from "@nestjs/common";
import {APP_PORT} from "../octoprint-websocket-mock.constants";


/**
 * A websocket gateway - so only intended for reaching out to ws-clients
 */
@WebSocketGateway(APP_PORT, {transports: ['websocket']})
export class OctoprintGateway implements OnGatewayInit, OnGatewayConnection {
    @WebSocketServer()
    server: Server;
    private logger = new Logger(OctoprintGateway.name);

    afterInit(server: Server) {
        this.logger.log('Gateway initialized, port: ' + server.options.port);
    }

    handleConnection(client: WebSocket, ...args) {
        const knownClient = this.getFirstClient();
        if (Object.is(client, knownClient)) {
            client.send(JSON.stringify("CONNECT"));
        } else {
            client.send("We serve 1 client only. Closing.");
            client.close(1013, "You will be ignored, we serve 1 client only.");
        }
    }

    @SubscribeMessage('broadcast')
    handleBroadcastEvent(@MessageBody() data: unknown): void {
        this.server.clients.forEach((client) => {
            client.send(JSON.stringify({data}));
        });
    }

    @SubscribeMessage('events')
    handleEvent(@MessageBody() data: unknown): WsResponse<unknown> {
        return {event: "echo", data: "GATEWAY OK"};
    }

    private getFirstClient() {
        return [...this.server.clients][0];
    }
}