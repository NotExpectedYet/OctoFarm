import {Test, TestingModule} from '@nestjs/testing';
import {TestProviders} from "../../../test/base/test.provider";
import {ServerSettingsCacheService} from "../../settings/services/server-settings-cache.service";
import {ServerSettingsService} from "../../settings/services/server-settings.service";
import {getRepositoryToken} from "@nestjs/typeorm";
import {ServerSettings} from "../../settings/entities/server-settings.entity";
import {FileStatisticsService} from "./file-statistics.service";

describe(FileStatisticsService.name, () => {
    let service: FileStatisticsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FileStatisticsService,
                ServerSettingsCacheService,
                ServerSettingsService,
                ...TestProviders,
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

        service = module.get<FileStatisticsService>(FileStatisticsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it("doesnt throw error on illegal printer array", async function () {
        const fakePrinter = {};
        expect(() => service.generate(fakePrinter, null)).not.toThrow();
    });

    it("should not generate file statistics when printer sortIndex is undefined, null, string or NaN", function () {
        const fakeIshPrinter = {
            fileList: [1]
        };
        service.generate(fakeIshPrinter, null);
        expect(service.getFile(0)).toBeUndefined();

        const fakeIshPrinter2 = {
            fileList: [1],
            sortIndex: null
        };
        service.generate(fakeIshPrinter2, null);
        expect(service.getFile(0)).toBeUndefined();

        const fakeIshPrinter3 = {
            fileList: [1],
            sortIndex: {}
        };
        service.generate(fakeIshPrinter3, null);
        expect(service.getFile(0)).toBeUndefined();

        const fakeIshPrinter6 = {
            fileList: [1],
            sortIndex: ""
        };
        service.generate(fakeIshPrinter6, null);
        expect(service.getFile(0)).toBeUndefined();

        const fakeIshPrinter4 = {
            fileList: [1],
            sortIndex: NaN
        };
        service.generate(fakeIshPrinter4, null);
        expect(service.getFile(0)).toBeUndefined();

        const fakeIshPrinter5 = {
            fileList: [1],
            sortIndex: -1
        };
        service.generate(fakeIshPrinter5, null);
        expect(service.getFile(0)).toBeUndefined();
    });

    it("should generate file statistics for badly formatted fileList", function () {
        const fakeIshPrinter = {
            fileList: [1],
            sortIndex: 0
        };

        expect(service.generate(fakeIshPrinter, null)).toBeUndefined();

        const fileStats = service.getFile(0);
        expect(fileStats).toBeTruthy();

        expect(service.statistics([fakeIshPrinter])).toBeUndefined();

        const stats = service.getStats();
        expect(stats).toBeTruthy();
        expect(stats.storagePercent).not.toBeNaN();
    });

    it("should generate file statistics for proper printer", function () {
        const fakeIshPrinter = {
            fileList: {
                files: [
                    {
                        fileSize: 100,
                        name: "test"
                    }
                ],
                fileCount: 150120310230 // absurdism
            },
            sortIndex: 0
        };

        expect(service.generate(fakeIshPrinter, null)).toBeUndefined();

        const fileStats = service.getFile(0);
        expect(fileStats).toBeTruthy();
        expect(fileStats.filecount).toEqual(150120310230);
        expect(Array.isArray(fileStats.fileList)).toBeTruthy();
        expect(fileStats.fileList[0].name).toEqual("test");
        expect(Array.isArray(fileStats.fileList[0].toolUnits)).toBeTruthy();
        expect(Array.isArray(fileStats.fileList[0].toolCosts)).toBeTruthy();
        const fakeIshFarmPrinters = [
            {
                fileList: {
                    files: [
                        {
                            size: 100,
                            length: 500
                        }
                    ]
                },
                storage: {
                    free: 100,
                    total: 500
                },
                sortIndex: 0
            }
        ];
        expect(service.statistics(fakeIshFarmPrinters)).toBeUndefined();

        const stats = service.getStats();
        expect(stats).toBeTruthy();
        expect(stats.storagePercent).not.toBeNaN();
        expect(stats).toEqual({
            storageUsed: 400,
            storageTotal: 500,
            storageRemain: 100,
            storagePercent: 80,
            fileCount: 1,
            folderCount: 0,
            biggestFile: 100,
            smallestFile: 100,
            biggestLength: 0.5,
            smallestLength: 0.5,
            averageFile: 100,
            averageLength: 0.5
        });
    });
});
