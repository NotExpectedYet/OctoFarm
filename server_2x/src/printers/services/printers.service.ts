import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Printer} from "../entities/printer.entity";
import {CreatePrinterDto} from "../dto/create-printer.dto";

@Injectable()
export class PrintersService {
    constructor(
        @InjectRepository(Printer) private printerRepository: Repository<Printer>,
    ) {
    }

    async list() {
        return await this.printerRepository.find({});
    }

    async createMultiple(input: CreatePrinterDto[]) {
        // Generate a unique sortIndex for the printer
        let count = await this.printerRepository.count();
        input.forEach(dto => dto.sortIndex = count++);

        const printers = input.map(dto => new Printer(dto));
        return await this.printerRepository.save(printers);
    }
}
