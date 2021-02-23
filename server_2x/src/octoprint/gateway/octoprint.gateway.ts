import {WebSocketGateway} from '@nestjs/websockets';
import {OctoprintService} from '../services/octoprint.service';

@WebSocketGateway()
export class OctoprintGateway {
    constructor(
        private readonly octoprintService: OctoprintService
    ) {
        this.connectOctoPrintClient();
    }

    connectOctoPrintClient() {
        // const socket = new WebSocket('ws://prusa');
        // socket.onopen = function () {
        //     console.log('Connected');
        //     socket.send(
        //         JSON.stringify({
        //             event: 'events',
        //             data: 'test',
        //         }),
        //     );
        //     socket.onmessage = function (data) {
        //         console.log(data);
        //     };
        // };
    }
}
