import {HttpService, Injectable} from '@nestjs/common';
import {Observable} from "rxjs";
import {OctoPrintSettingsDto} from "../dto/octoprint-settings.dto";
import {RestConnectionParams} from "../models/rest-connection.params";
import {map} from "rxjs/operators";
import {AxiosRequestConfig} from "axios";
import {OctoPrintCurrentUserDto} from "../dto/octoprint-currentuser.dto";
import {OctoPrintSessionDto} from "../dto/octoprint-session.dto";
import {WebsocketConnectionParams} from "../models/websocket-connection.params";

@Injectable()
export class OctoPrintClientService {
    constructor(
        private httpService: HttpService
    ) {
    }

    getSettings(params: RestConnectionParams): Observable<OctoPrintSettingsDto> {
        this.checkConnectionParams(params);

        const url = new URL('api/settings', params.printerURL).toString();
        return this.connectWithParams<OctoPrintSettingsDto>(params, "GET", url);
    }

    getCurrentUser(params: RestConnectionParams): Observable<OctoPrintCurrentUserDto> {
        this.checkConnectionParams(params);

        const url = new URL('api/currentuser', params.printerURL).toString();
        return this.connectWithParams<OctoPrintCurrentUserDto>(params, "GET", url);
    }

    loginUserSession(params: RestConnectionParams): Observable<OctoPrintSessionDto> {
        this.checkConnectionParams(params);

        const url = new URL('api/login?passive=true', params.printerURL).toString();
        return this.connectWithParams<OctoPrintSessionDto>(params, "POST", url);
    }

    setCORSEnabled(params: RestConnectionParams): Observable<OctoPrintSettingsDto> {
        this.checkConnectionParams(params);

        const url = new URL('api/settings', params.printerURL).toString();
        const data = {
            "api": {
                "allowCrossOrigin": true
            }
        };
        return this.connectWithParams<OctoPrintSettingsDto>(params, "POST", url, data);
    }

    protected connectWithParams<R>(params: RestConnectionParams, method: "GET" | "POST" | "PUT" | "DELETE", url: string, body?: any) {
        const connectionConfig: AxiosRequestConfig = {
            headers: {
                "x-api-key": params.printerKey
            }
        };
        switch (method) {
            case "GET":
                return this.httpService.get<R>(url, connectionConfig).pipe(map(r => r.data));
            case "POST":
                return this.httpService.post<R>(url, body, connectionConfig).pipe(map(r => r.data));
            case "PUT":
                return this.httpService.delete<R>(url, connectionConfig).pipe(map(r => r.data));
            case "DELETE":
                return this.httpService.delete<R>(url, connectionConfig).pipe(map(r => r.data));
        }
    }

    private checkConnectionParams(connectionParams: RestConnectionParams) {
        if (!connectionParams.printerURL) {
            throw Error("Can't connect to OctoPrint's API without URL");
        }

        const errors = connectionParams.validateParams();
        if (errors.length > 0) {
            throw Error("Can't reach your printer's API without proper connection parameters. "
                + JSON.stringify(connectionParams));
        }
    }
}
