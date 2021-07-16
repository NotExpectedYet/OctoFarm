import {Body, Controller, Get, Logger, Post, Res} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {AuthService} from "../services/auth.service";
import {ServerSettingsService} from "../../settings/services/server-settings.service";
import {Public} from "../../utils/auth.decorators";
import {LoginUserDto} from "../dto/login-user.dto";

@Controller()
@ApiTags(AuthMvcController.name)
@Public()
export class AuthMvcController {
    private readonly logger = new Logger(AuthMvcController.name);

    constructor(
        private authService: AuthService,
        private serverSettingsService: ServerSettingsService
    ) {
    }

    // ======= LEGACY MVC ENDPOINTS BELOW - PHASED OUT SOON ======
    @Get("auth/login")
    async login(@Res() res) {
        const settings = await this.serverSettingsService.findFirstOrAdd();
        /* OLD FILE server_src/routes/users.js*/
        res.render("login", {
            octoFarmPageTitle: "Taitel",
            page: "Login",
            registration: settings.server.registration,
            serverSettings: settings,
        });
    }

    @Post("auth/login")
    @Public()
    async loginSubmit(@Body() loginDto: LoginUserDto, @Res() res) {
        const settings = await this.serverSettingsService.findFirstOrAdd();
        this.logger.log('Validating user login');
        const existingUser = await this.authService.validateLoginUserDto(loginDto);

        /* OLD FILE server_src/routes/users.js*/
        res.render("login", {
            octoFarmPageTitle: "Taitel",
            page: "Login",
            registration: settings.server.registration,
            serverSettings: settings,
        });
    }
}
