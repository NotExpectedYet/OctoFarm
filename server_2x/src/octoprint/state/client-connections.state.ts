import {OctoPrintClientService} from "../services/octoprint-client.service";
import {tap} from "rxjs/operators";
import {Observable} from "rxjs";
import {ClientConnectionStateModel} from "../models/client-connection-state.model";
import {RestConnectionParams} from "../models/rest-connection.params";
import {Injectable, Logger} from "@nestjs/common";
import {validate} from "class-validator";
import {AxiosError} from "axios";
import HttpStatusCode from "../../utils/http-status-codes.enum";
import {OctoprintGroupType} from "../types/octoprint-group.type";
import {WebsocketConnectionParams} from "../models/websocket-connection.params";
import {OctoprintGateway} from "../../../tools/octoprint-websocket-mock/gateway/octoprint.gateway";
import {WebsocketClientService} from "../services/websocket-client.service";

@Injectable()
export class ClientConnectionsState {
    public static defaultState: ClientConnectionStateModel = {
        apiKeyValid: undefined,
        apiKeyAccepted: undefined,
        apiKeyIsGlobal: undefined,
        apiConnected: undefined,
        sessionKeyAcquired: undefined,
        corsEnabled: undefined,
        userHasRequiredGroups: undefined,
        websocketConnected: undefined,
        websocketHealthy: undefined
    };
    private connectionParams: RestConnectionParams;
    private websocketProtocol: 'ws' | 'wss';
    private sessionConnectionParams?: WebsocketConnectionParams;
    private state: ClientConnectionStateModel;
    private logger = new Logger(ClientConnectionsState.name);

    constructor(
        private octoPrintClientService: OctoPrintClientService,
        private websocketClientService: WebsocketClientService
    ) {
    }

    public async initState(connectionParams: RestConnectionParams, websocketProtocol: 'ws' | 'wss') {
        if (!this.state) {
            this.state = {...ClientConnectionsState.defaultState};
            this.connectionParams = connectionParams;
            await this.validateConnectionParams();
            this.websocketProtocol = websocketProtocol;
        } else {
            throw Error("Can't initialize already known state.");
        }
    }

    public async testClientConnection(messageClb?: OctoprintGateway) {
        if (!this.state) {
            throw new Error("Call initState(connectionParams) before testing the client connection.");
        }

        const jsonParams = JSON.stringify(this.connectionParams);
        await this.octoPrintClientService.getSettings(this.connectionParams)
            .subscribe(
                async settings => {
                    if (!settings.api)
                        throw new Error("Client settings response did not contain the api section. Cant validate client connection.");

                    this.patchState({
                        apiConnected: true,
                        apiKeyAccepted: true
                    });

                    const apiKey = settings.api.key;
                    if (apiKey === undefined)
                        throw new Error("Client settings api:apiKey was not found. Cant test connection. Aborting.");
                    this.validateKeyIsNotGlobalKey(apiKey);

                    const corsEnabled = settings.api.allowCrossOrigin;
                    if (corsEnabled === undefined)
                        throw new Error("Client settings api:allowCrossOrigin was not found. Cant test connection. Aborting.");
                    this.patchState({
                        corsEnabled
                    });

                    const userSession = await this.octoPrintClientService.loginUserSession(this.connectionParams).toPromise();
                    if (!userSession.session) {
                        throw new Error("Could not acquire valid session key from OctoPrint API.");
                    }
                    const sessionKey = userSession.session;
                    this.patchState({
                        sessionKeyAcquired: !!sessionKey
                    });

                    const userFulfillsRequiredGroups = userSession.groups.includes(OctoprintGroupType.ADMIN.toString())
                        && userSession.groups.includes(OctoprintGroupType.USERS.toString());
                    this.patchState({
                        userHasRequiredGroups: userFulfillsRequiredGroups
                    });
                    if (!userFulfillsRequiredGroups) {
                        throw new Error("User does not have the required groups to operate OctoPrint remotely from OctoFarm.");
                    }

                    this.sessionConnectionParams = new WebsocketConnectionParams(
                        this.connectionParams.printerURL, userSession.session, userSession.name);
                    try {
                        const socketOpen = await this.websocketClientService.start(this.sessionConnectionParams, this.websocketProtocol, 2);
                        if (!!socketOpen) {
                            this.patchState({
                                websocketConnected: true,
                                websocketHealthy: true,
                            });
                        }
                    } catch (e) {
                        this.logger.error('Client state error', e);
                    }
                }, (error: AxiosError) => {
                    if (error.isAxiosError) {
                        if (!error?.response || error?.response.status === null || error?.response.status === undefined) {
                            this.logger.error("OctoPrint did not respond. AxiosResponse:response field was empty or didn't contain a status code, so the error cannot be handled properly.");
                            return;
                        }

                        const status = error.response.status;
                        switch (status as HttpStatusCode) {
                            case HttpStatusCode.FORBIDDEN:
                                this.patchState({
                                    apiConnected: true,
                                    apiKeyAccepted: false
                                });
                                this.logger.error("This API key was not accepted by OctoPrint using these parameters:\n\t" + jsonParams);
                                break;
                            case HttpStatusCode.BAD_GATEWAY || 0:
                                this.patchState({
                                    apiConnected: false,
                                    apiKeyAccepted: null
                                });
                                this.logger.error("OctoPrint return BAD_GATEWAY or we didnt have network access. Make sure connections to OctoPrint are fine.\n\t"
                                    + jsonParams, error.stack);
                                break;
                            case HttpStatusCode.NOT_FOUND || HttpStatusCode.BAD_REQUEST:
                                this.patchState({
                                    apiConnected: true,
                                    apiKeyAccepted: null
                                });
                                this.logger.error("The OctoPrint API returned error (bad request or not found):\n\tCode:"
                                    + status, error.stack);
                                break;
                            default:
                                this.logger.error("OctoPrint client responded with an unknown status when using the following parameters: "
                                    + this.connectionParams, error.stack);
                                break;
                        }

                        console.warn('state', this.getState());
                    } else {
                        this.logger.error("Couldn't call the OctoPrint connector service due to internal error. " + jsonParams, error.stack);
                    }
                }
            );
    }

    public getState() {
        return Object.freeze(this.state); // Reduce
    }

    isApiKeyStateValidated() {
        return !!this.state && this.state.apiKeyValid;
    }

    isApiKeyStateAccepted() {
        return this.isApiKeyStateValidated()
            && this.state.apiKeyAccepted
            && this.state.apiKeyIsGlobal === false;
    }

    userHasRequiredRoles() {
        // Alternatively we could scan the permissions, but that's much more work.
        return this.isApiKeyStateAccepted()
            && this.state.userHasRequiredGroups;
    }

    ensureCorsEnabled(): Observable<any> {
        if (!this.connectionParams) {
            throw new Error("Cant enable CORS when connection params are not provided for instance.");
        }
        if (this.userHasRequiredRoles()) {
            return this.octoPrintClientService
                .setCORSEnabled(this.connectionParams)
                .pipe(tap(_ => {
                    this.patchState({
                        corsEnabled: true
                    });
                }, error => {
                    // Analyze the state
                    // ...
                    // Conclude how the error 'resets' the state
                    this.patchState({
                        corsEnabled: false,
                        websocketConnected: false,
                        websocketHealthy: false
                    });
                    // rethrow the error or let Promise.reject do the work
                }));
        }
    }

    private async validateConnectionParams() {
        const errors = await validate(this.connectionParams);
        this.patchState({
            apiKeyValid: errors?.length === 0
        });
    }

    private validateKeyIsNotGlobalKey(globalKey: string) {
        if (this.connectionParams.printerKey === globalKey) {
            this.patchState({
                apiKeyIsGlobal: true
            });
            throw Error("This connection has a Global API key. That's not tolerated. Please provide an OctoPrint Application Key or User API Key instead.");
        } else {
            this.patchState({
                apiKeyIsGlobal: false
            });
        }
    }

    private patchState(adjustments: Partial<ClientConnectionStateModel>) {
        const newState = {
            ...this.state,
            ...adjustments
        };

        // Calculate differences
        // ...
        // Log the action
        // ...

        // Act
        this.state = newState;
    }
}