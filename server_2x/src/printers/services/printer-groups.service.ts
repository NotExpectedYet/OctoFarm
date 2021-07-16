import {Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {PrinterGroup} from "../entities/printer-group.entity";

@Injectable()
export class PrinterGroupsService {
    private readonly logger = new Logger(PrinterGroupsService.name);

    constructor(
        @InjectRepository(PrinterGroup) private printerGroupRepository: Repository<PrinterGroup>,
    ) {
    }

    async list() {
        return await this.printerGroupRepository.find();
    }
}
