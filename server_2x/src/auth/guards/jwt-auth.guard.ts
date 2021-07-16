import {ExecutionContext, Injectable, Logger, UnauthorizedException} from "@nestjs/common";
import {AuthGuard} from "@nestjs/passport";
import {Reflector} from "@nestjs/core";
import {IS_PUBLIC_KEY} from "../../utils/auth.decorators";
import {BootController} from "../../boot/boot.controller";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(
        private reflector: Reflector
    ) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const className = context.getClass().name;
        if (className !== BootController.name) {
            this.logger.log(`${context.getType().toUpperCase()} ${className}:${context.getHandler().name}`,
                JwtAuthGuard.name + ':' + this.canActivate.name);
        }
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        // You can throw an exception based on either "info" or "err" arguments
        if (err || !user) {
            throw err || new UnauthorizedException();
        }
        return user;
    }
}
