import {Test, TestingModule} from "@nestjs/testing";
import {PrintersController} from "./printers.controller";
import {TestProviders} from "../../../test/base/test.provider";
import {PrintersService} from "../services/printers.service";

describe(PrintersController.name, () => {
    let printersController: PrintersController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [PrintersController],
            providers: [
                {
                    provide: PrintersService,
                    useValue: {
                        list: jest.fn(() => [])
                    }
                },
                ...TestProviders
            ]
        }).compile();

        printersController = app.get<PrintersController>(PrintersController);
    });

    describe("root", () => {
        it("should return empty list of printers.", async () => {
            expect(await printersController.list()).toHaveLength(0);
        });
    });
});
