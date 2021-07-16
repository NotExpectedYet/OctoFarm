import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { FileManagementService } from '../services/file-management.service';
import { CreateFileManagementDto } from '../dto/create-file-management.dto';
import { UpdateFileManagementDto } from '../dto/update-file-management.dto';

@Controller('file-management')
export class FileManagementController {
  constructor(private readonly fileManagementService: FileManagementService) {}

  @Post()
  create(@Body() createFileManagementDto: CreateFileManagementDto) {
    return this.fileManagementService.create(createFileManagementDto);
  }

  @Get()
  findAll() {
    return this.fileManagementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fileManagementService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateFileManagementDto: UpdateFileManagementDto) {
    return this.fileManagementService.update(+id, updateFileManagementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fileManagementService.remove(+id);
  }
}
