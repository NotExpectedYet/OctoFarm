import { Module } from '@nestjs/common';
import { FileManagementService } from './services/file-management.service';
import { FileManagementController } from './controllers/file-management.controller';

@Module({
  controllers: [FileManagementController],
  providers: [FileManagementService]
})
export class FileManagementModule {}
