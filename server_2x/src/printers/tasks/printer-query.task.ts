import {Injectable, Logger} from '@nestjs/common';

@Injectable()
export class PrinterQueryTask {
    private readonly logger = new Logger(PrinterQueryTask.name);
    private lastRun: number;

    // @Cron('45 * * * * *')
    // handleCron() {
    //     this.logger.debug('Called when the second is 45');
    // }

    // @Interval(55)
    // handleInterval() {
    //
    //     this.logger.warn('Called every 55 milli-seconds');
    // }
    //
    // @Interval(233)
    // handleIntervalFast() {
    //     this.logger.warn('Called every 233 milli-seconds');
    // }

    // @Timeout(5000)
    // handleTimeout() {
    //     this.logger.warn('Called once after 5 seconds');
    // }
}