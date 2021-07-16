import {Test, TestingModule} from '@nestjs/testing';
import {TestProviders} from "../../../test/base/test.provider";
import {JobStatisticsService} from "./job-statistics.service";
import {HistoryCache} from "./history.cache";
import {HistoryService} from "./history.service";
import {ServerSettingsCacheService} from "../../settings/services/server-settings-cache.service";
import {ServerSettingsService} from "../../settings/services/server-settings.service";
import {getRepositoryToken} from "@nestjs/typeorm";
import {PrinterHistory} from "../entities/printer-history.entity";
import {PrinterHistoryEntityMock} from "../entities/mocks/printer-history-entity.mock";
import {ServerSettings} from "../../settings/entities/server-settings.entity";

describe(JobStatisticsService.name, () => {
    let service: JobStatisticsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JobStatisticsService,
                HistoryCache,
                HistoryService,
                ServerSettingsCacheService,
                ServerSettingsService,
                ...TestProviders,
                {
                    provide: getRepositoryToken(PrinterHistory),
                    useClass: PrinterHistoryEntityMock
                },
                {
                    provide: getRepositoryToken(ServerSettings),
                    useValue: {
                        findOne: () => {
                            return {filamentManager: false}
                        },
                        save: () => Promise.resolve()
                    },
                },
            ]
        }).compile();

        service = module.get<JobStatisticsService>(JobStatisticsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it("should generate printer job report", async function () {
        const copiedFileName = "bla.geezcode";
        const printer = {
            fileList: {
                files: [
                    {
                        name: copiedFileName // Crucial?
                    }
                ]
            },
            job: {
                file: {
                    name: copiedFileName // Crucial?
                }
            },
            sortIndex: 0, // This is apparently crucial, but no error?
            systemChecks: {
                cleaning: {
                    job: {} // Crucial?
                }
            }
        };
        const result = await service.generate(printer, null);
        expect(result).toBeUndefined();
        expect(service.getCleanJobAtIndex(0).fileName).toEqual(copiedFileName);
        expect(service.getCleanJobAtIndex(1)).toBeUndefined();
    });
});


// Before luxon
function legacyUUTGetCompletionDate(printTimeLeft, completion) {
    let currentDate = (new Date()).getTime();
    let dateComplete = "";
    if (completion === 100) {
        dateComplete = "No Active Job";
    } else {
        const futureDateString = new Date(
            currentDate + printTimeLeft * 1000
        ).toDateString();
        let futureTimeString = new Date(
            currentDate + printTimeLeft * 1000
        ).toTimeString();
        futureTimeString = futureTimeString.substring(0, 5);
        dateComplete = `${futureDateString}: ${futureTimeString}`;
    }
    return dateComplete;
}

describe("getCompletionDate", function () {
    it("should calculate formatted completion date", async function () {
        const completionDate = JobStatisticsService.getCompletionDate(10, 99);
        expect(completionDate).toBeTruthy();
        expect(completionDate).toEqual(legacyUUTGetCompletionDate(10, 99));
    });
});
