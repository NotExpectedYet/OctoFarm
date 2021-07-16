import {Test, TestingModule} from '@nestjs/testing';
import {FileManagementController} from './file-management.controller';
import {FileManagementService} from '../services/file-management.service';

describe(FileManagementController.name, () => {
    let controller: FileManagementController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FileManagementController],
            providers: [FileManagementService],
        }).compile();

        controller = module.get<FileManagementController>(FileManagementController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
