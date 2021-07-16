import {Controller, Get} from '@nestjs/common';
import {ApiService} from './api.service';
import {Public} from "../utils/auth.decorators";

@Controller("api")
export class ApiController {
    constructor(
        private readonly apiService: ApiService
    ) {
    }

    @Public()
    @Get("check-database")
    checkDatabaseConnected() {
        return this.apiService.isDatabaseConnected();
    }

    @Public()
    @Get("check-api-status")
    checkApiStatus() {
        return {
            apiVersion: process.env.npm_package_version
        }
    }
}
