import {Controller, Get, Res} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {Public} from "../../utils/auth.decorators";

@Controller()
@ApiTags(LegacyRedirectsController.name)
export class LegacyRedirectsController {

    @Get("printersInfo/get")
    @Public()
    redirectLegacyPrintersInfoSSE(@Res() res) {
        res.redirect("/printers/update-sse");
    }
}