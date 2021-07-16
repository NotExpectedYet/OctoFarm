import {Controller, Get} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {APP_PORT} from "../octoprint-websocket-mock.constants";

@Controller('')
@ApiTags(TestClientController.name)
export class TestClientController {

    @Get()
    index() {
        return `
        <html>
          <head>
            <script> 
                let socket;
                function listenChanges() {
                    socket = new WebSocket('ws://localhost:'+${APP_PORT});
                    socket.onerror = () => {
                        this.socket.close();
                    };
                    socket.onmessage = (message) => {
                        const body = JSON.parse(message.data);
                        if (!body.data?.type) {
                            return;
                        }
                        console.log(body.data.type, JSON.stringify(body.data.payload));
                        document.getElementById("messageContainer").innerHTML 
                            +=(body.data.type + " - ");
                        document.getElementById("messageContainer").innerHTML 
                            +=(JSON.stringify(body.data.payload, undefined,2 ) + "<br>");
                        window.scrollTo(0,document.body.scrollHeight);
                    }
                    socket.onopen = () => {
                        clearInterval(this.timerId);
                        console.warn('opened connection');
                
                        socket.onclose = () => {
                            console.warn('closed connection');
                            this.timerId = setInterval(() => {
                                this.listenChanges();
                            }, 2000);
                        }
                    }
                }
                function callEvent() {
                    socket.send(
                      JSON.stringify({
                        event: 'events',
                        data: 'Client ACK',
                      }),
                    );
                }
                listenChanges();
            </script>
          </head>
          <body>
            <button onClick="callEvent()">Poke gateway</button>
            <div id="messageContainer">
            </div>
          </body>
        </html>            
        `;
    }
}