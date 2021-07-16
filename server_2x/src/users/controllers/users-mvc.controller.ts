import {Body, Controller, Get, Post, Req, Res} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {ServerSettingsService} from "../../settings/services/server-settings.service";
import {settings} from "cluster";
import {Public} from "../../utils/auth.decorators";
import {UsersService} from "../services/users.service";
import {RegisterInputDto} from "../dto/register-input.dto";

@Controller("users")
@ApiTags(UsersMvcController.name)
@Public() // TODO change to different auth (session/jwt/cookie)
export class UsersMvcController {
    constructor(
        private serverSettingsService: ServerSettingsService,
        private usersService: UsersService
    ) {
    }

    // ======= LEGACY MVC ENDPOINTS BELOW - PHASED OUT SOON ======
    @Post("login")
    async loginUserSubmit(@Res() res) {
        await res.redirect("/auth/login");
    }

    @Get("login")
    async loginUser(@Res() res) {
        await res.redirect("/auth/login");
    }

    @Get("register")
    async register(@Res() res) {
        const serverSettings = await this.serverSettingsService.findFirstOrAdd();
        if (serverSettings?.server?.registration === true) {
            const userCount = await this.usersService.getUserCount();
            res.render("register", {
                octoFarmPageTitle: "Taitel",
                page: "Register",
                serverSettings: settings,
                userCount
            });
        }
    }


    @Post("register")
    async registerSubmit(@Body() validatedInput: RegisterInputDto, @Req() req, @Res() res) {
        await this.usersService.register(validatedInput);

        req.flash(
            "success_msg",
            "You are now registered and can login"
        );
        res.redirect("/auth/login");
    }
}
