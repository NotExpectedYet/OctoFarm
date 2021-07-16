import {Controller, Get} from '@nestjs/common';
import {Public} from "../../utils/auth.decorators";
import {PrinterGroupsService} from "../services/printer-groups.service";

// TODO will not correspond with 'groups' but that was dubious, therefore have to change JS
@Controller('printer-groups')
export class PrinterGroupsController {
    constructor(
        private printerGroupsService: PrinterGroupsService
    ) {
    }

    @Get("list")
    @Public()
    async listPrinterGroups() {
        return await this.printerGroupsService.list();
    }
}
