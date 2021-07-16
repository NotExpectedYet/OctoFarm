import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {PrinterHistory} from "../entities/printer-history.entity";

@Injectable()
export class HistoryService {
    constructor(
        @InjectRepository(PrinterHistory) private printerHistoryRepository: Repository<PrinterHistory>,
    ) {
    }

    /**
     * Find historical entries for one or more printers
     * @param filter
     */
    async find(filter) {
        return this.printerHistoryRepository.find(filter);
    }

    getFileFromHistoricJob(history) {
        const historyJob = history?.job;
        const historyJobFile = history?.job?.file;

        return {
            name: history.fileName,
            uploadDate: historyJobFile?.date || null,
            path: historyJobFile?.path || history.filePath, // TODO discuss this alternative
            size: historyJobFile?.size || null,
            averagePrintTime: historyJob?.averagePrintTime || null,
            lastPrintTime: historyJob?.lastPrintTime || null,
        };
    }
}
