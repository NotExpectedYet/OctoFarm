import {ArgumentsHost, Catch, Logger} from '@nestjs/common';
import {BaseExceptionFilter} from '@nestjs/core';

@Catch()
export class ExceptionsLoggerFilter extends BaseExceptionFilter {
    private readonly logger = new Logger("ExceptionsLoggerFilter");

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        this.logger.warn('Exception ' + request.url + ' ' + exception);
        super.catch(exception, host);
    }
}