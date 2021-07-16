import {Injectable, Logger} from "@nestjs/common";
import {ThrottleMessage, ThrottleRate} from "../dto/websocket-input/throttle.message";
import {AuthMessage} from "../dto/websocket-input/auth.message";
import * as WebSocket from "ws";
import {WebsocketConnectionParams} from "../models/websocket-connection.params";
import {ConnectionMessageDto} from "../dto/websocket-output/connection-message.dto";
import {HistoryMessageDto} from "../dto/websocket-output/history-message.dto";
import {TimelapseMessageDto} from "../dto/websocket-output/timelapse-message.dto";
import {CurrentMessageDto} from "../dto/websocket-output/current-message.dto";
import {EventMessageDto} from "../dto/websocket-output/event-message.dto";
import {PluginMessageDto} from "../dto/websocket-output/plugin-message.dto";
import path from "path";
import {transform} from "json-to-typescript/index";
import fs from "fs";
import {backoff} from "../providers/backoff.generator";

@Injectable()
export class WebsocketClientService {
    private socketURL: string;
    private octoprintParams: WebsocketConnectionParams;
    private throttleRate: ThrottleRate = 1;
    private authState: "SUCCESS" | "FAILURE" = null;
    private logger = new Logger(WebsocketClientService.name);
    private socket: WebSocket;
    private enableMessageTransforms = false;
    private knownEventTypes = [];

    constructor() {
        this.socket = null;
        this.authState = null;
    }

    public async start(params: WebsocketConnectionParams, websocketProtocol: 'ws' | 'wss', throttleRate: ThrottleRate = 1) {
        this.checkConnectionParams(params, websocketProtocol);
        if (!!throttleRate) {
            this.constructURL(params, websocketProtocol);
            this.octoprintParams = params;

            await this.connectWithBackoff(throttleRate);
            return this.socket.OPEN;
        } else {
            throw new Error("Illegal throttle rate provided. Needs to be 1 or higher.");
        }
    }

    public getURL() {
        return this.socketURL;
    }

    public getAuthState() {
        return this.authState;
    }

    public sendGeneric(payload: any, cb?) {
        this.throwIfInvalidSocketState();
        this.socket.send(JSON.stringify(payload), cb);
    }

    public setThrottleRate(inputRate: ThrottleRate) {
        if (this.throttleRate != inputRate) {
            this.sendThrottle({throttle: inputRate});
        }
    }

    private async connectWithBackoff(throttleRate: ThrottleRate) {
        await backoff(10, async () => {
            await this.bindRegenerativeSocket(throttleRate);
        }, 5000);
    }

    /**
     * Developer mode only, write message DTOs.
     * @param dtoData
     * @param fileName
     * @param interfaceName
     */
    private writeDto(dtoData: any, fileName, interfaceName) {
        // Used to generate dto's - keep
        const schemaDtoFile = path.join("./src/octoprint/dto/websocket/events/", fileName);
        transform(interfaceName, dtoData)
            .then(transformation => {
                fs.writeFileSync(schemaDtoFile, transformation);
            });
    }

    private async sendAuth(input: AuthMessage) {
        if (!input.validateAuth()) {
            throw Error("Invalid authentication input provided to connect with OctoPrint Websocket");
        }
        return new Promise((resolve, reject) => this.sendGeneric(input, (error) => {
                if (!!error) {
                    this.authState = "FAILURE";
                    this.logger.error("X OctoPrint WebSocket authentication failed:", error);
                    reject();
                } else {
                    this.authState = "SUCCESS";
                    this.logger.log("✓ OctoPrint WebSocket authentication success");
                    resolve(this.authState);
                }
            })
        );
    }

    private sendThrottle(input: ThrottleMessage) {
        this.sendGeneric(input, (error) => {
            if (!!error) {
                this.logger.error('OctoPrint WebSocket throttle command failed:', error);
            } else {
                this.throttleRate = input.throttle;
            }
        });
    }

    private createSocketSafely() {
        if (!this.socketURL) {
            throw new Error("WebSocket URL not provided. Error on setting up socket.");
        }
        if (!this.socketURL.includes('ws') && !this.socketURL.includes('wss')) {
            throw new Error("WebSocket URL did not contain 'ws://' or 'wss://' transport prefix. Error on setting up socket.");
        }

        if (!!this.socket) {
            this.socket.removeAllListeners();
        }
        this.socket = new WebSocket(this.socketURL);
    }

    private bindRegenerativeSocket(throttleRate: ThrottleRate) {
        return new Promise((resolve, reject) => {
            this.createSocketSafely();

            this.socket.onerror = (event: WebSocket.ErrorEvent) => {
                this.logger.warn("WebSocket error received", event.message);
            };
            this.socket.onopen = async (event) => {
                this.logger.debug("WebSocket opened");

                const authKeyMessage = new AuthMessage(this.octoprintParams.username || 'prusa', this.octoprintParams.sessionKey);
                await this.sendAuth(authKeyMessage);
                if (this.authState == "SUCCESS") {
                    this.setThrottleRate(throttleRate);
                    resolve(this.authState);
                } else {
                    reject(this.authState);
                }
            };
            this.socket.onmessage = (event) => {
                this.handleSocketMessage(event?.data);
            }
            this.socket.onclose = async () => {
                this.logger.log("Websocket closed.");

                // I hate this recursive nesting... is there really no better way?
                await setTimeout(async () => {
                    await this.connectWithBackoff(throttleRate);
                }, throttleRate * 500);
            };
        });
    }

    private handleSocketMessage(data: any) {
        const jsonMessage = JSON.parse(data.toString()) as
            ConnectionMessageDto
            | HistoryMessageDto
            | TimelapseMessageDto
            | CurrentMessageDto
            | EventMessageDto
            | PluginMessageDto;
        let analysedType = "";
        if (jsonMessage.connected !== undefined) {
            this.logger.log('OctoPrint WebSocket connected. version: ' + jsonMessage.connected.version);
            analysedType = "connected";
        } else if (jsonMessage.history !== undefined) {
            this.logger.log('OctoPrint WebSocket History message. Progress/completion: ' + jsonMessage.history.progress.completion);
            analysedType = "history";
        } else if (jsonMessage.timelapse !== undefined) {
            this.logger.log('OctoPrint WebSocket Timelapse message: ' + jsonMessage.timelapse);
            analysedType = "timelapse";
        } else if (jsonMessage.current !== undefined) {
            analysedType = "current";
        } else if (jsonMessage.event !== undefined) {
            const eventType = jsonMessage.event.type;

            // Triggers transform to file in DEV mode (will restart NestJS in watch mode, so not too easy to use in that case)
            if (!this.knownEventTypes.includes(eventType) && this.enableMessageTransforms) {
                this.knownEventTypes.push(eventType);
                const fileName = eventType.replace(/[A-Z]/g, (match, offset) => (offset > 0 ? '-' : '') + match.toLowerCase()) + ".dto.ts";
                const dtoInterfaceName = eventType + "Dto";
                if (!fileName || !dtoInterfaceName) {
                    console.error('Failed to process new event message! Type:', eventType, dtoInterfaceName, fileName);
                } else {
                    console.log('New event message! Type:', eventType, dtoInterfaceName, fileName);
                    this.writeDto(jsonMessage.event.payload, fileName, dtoInterfaceName);
                }
            } else {
                console.log('Known event message. type:', eventType);
            }
            analysedType = "event";
        } else if (jsonMessage.plugin !== undefined) {
            console.log('plugin message. plugin:', jsonMessage.plugin.plugin);
            analysedType = "plugin";
        } else {
            console.log('unknown message type');
        }

        //     if (!!proxyGateway?.handleBroadcastEvent) {
        //         proxyGateway.handleBroadcastEvent({
        //             type: analysedType,
        //             payload: jsonMessage
        //         });
        //     }
    }

    /**
     * Construct URL with secure or open Websocket transport
     * @param params
     * @param protocol
     * @private
     */
    private constructURL(params: WebsocketConnectionParams, protocol: 'ws' | 'wss') {
        const constructedURL = new URL(params.printerWsURL);
        this.socketURL = `${protocol}://${constructedURL.host}/sockjs/websocket`;
    }

    private throwIfInvalidSocketState() {
        if (!this.socket?.OPEN) {
            throw new Error("Cant send data on Websocket which is not open.");
        }
    }

    private checkConnectionParams(connectionParams: WebsocketConnectionParams, websocketProtocol: 'ws' | 'wss') {
        if (!connectionParams.printerWsURL) {
            throw Error("Websocket cant connect to your printer Websocket without URL.");
        }
        if (websocketProtocol !== 'ws' && websocketProtocol !== 'wss') {
            throw Error(`Websocket protocol prefix not the right option ${websocketProtocol} is not either 'ws' (non-secured) or 'wss' (secured)`);
        }

        const errors = connectionParams.validateParams();
        if (errors.length > 0) {
            throw Error("Can't reach your printer's API or WebSocket without proper connection parameters. "
                + JSON.stringify(connectionParams));
        }
    }
}