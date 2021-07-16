import {Controller, Get} from "@nestjs/common";
import {PrintersService} from "../services/printers.service";
import {ApiTags} from "@nestjs/swagger";
import {Printer} from "../entities/printer.entity";

@Controller("api/printers")
@ApiTags(PrintersController.name)
export class PrintersController {
    constructor(
        private readonly printersService: PrintersService
    ) {
    }

    @Get()
    async list(): Promise<Printer[]> {
        return await this.printersService.list();
    }
}
