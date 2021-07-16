import {Body, Controller, NotImplementedException, Post, Req} from "@nestjs/common";
import {AuthService} from "../services/auth.service";
import {ApiTags} from "@nestjs/swagger";
import {LoginUserDto} from "../dto/login-user.dto";
import {Public} from "../../utils/auth.decorators";

@Controller("auth")
@ApiTags(AuthController.name)
export class AuthController {
    constructor(private authService: AuthService) {
    }

    @Public()
    @Post("token")
    async token(@Body() loginUserDto: LoginUserDto) {
        return this.authService.createToken(loginUserDto);
    }

    @Public()
    @Post("refresh-token")
    async refreshToken(@Req() request) {
        // return this.authService.validateToken(loginUserDto);
        throw new NotImplementedException();
    }
}