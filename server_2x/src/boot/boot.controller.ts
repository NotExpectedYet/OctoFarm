import {Controller, Get, Res} from "@nestjs/common";
import {Public} from "../utils/auth.decorators";
import {ApiService} from "../api/api.service";

@Controller()
export class BootController {
    // TODO make timeout-based on frontend so be dont go CPU 100%
    @Get('serverchecks/amialive')
    @Public()
    index() {
        // Need this for normal and fallback mode
        return true;
    }

    // ======= LEGACY MVC ENDPOINTS BELOW - PHASED OUT SOON ======

    @Get()
    @Public()
    root(@Res() res) {
        if (ApiService.databaseStartupErrorOccurred) {
            res.render("database", {page: "Database Warning"});
        } else {
            res.redirect("auth/login");
        }
    }
}