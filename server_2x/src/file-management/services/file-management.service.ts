import { Injectable } from '@nestjs/common';
import { CreateFileManagementDto } from '../dto/create-file-management.dto';
import { UpdateFileManagementDto } from '../dto/update-file-management.dto';

@Injectable()
export class FileManagementService {
  create(createFileManagementDto: CreateFileManagementDto) {
    return 'This action adds a new fileManagement';
  }

  findAll() {
    return `This action returns all fileManagement`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fileManagement`;
  }

  update(id: number, updateFileManagementDto: UpdateFileManagementDto) {
    return `This action updates a #${id} fileManagement`;
  }

  remove(id: number) {
    return `This action removes a #${id} fileManagement`;
  }
}
