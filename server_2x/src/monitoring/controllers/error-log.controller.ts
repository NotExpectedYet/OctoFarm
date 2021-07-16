import {Body, Controller, Delete, Get, Param, Post, Put} from '@nestjs/common';
import {CreateMonitoringDto} from '../dto/create-monitoring.dto';
import {UpdateMonitoringDto} from '../dto/update-monitoring.dto';
import {ErrorLogService} from "../services/error-log.service";
import {ApiTags} from "@nestjs/swagger";

@Controller('error-log')
@ApiTags(ErrorLogController.name)
export class ErrorLogController {
    constructor(private readonly errorLogService: ErrorLogService) {
    }

    @Post()
    create(@Body() createMonitoringDto: CreateMonitoringDto) {
        return this.errorLogService.create(createMonitoringDto);
    }

    @Get()
    findAll() {
        return this.errorLogService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.errorLogService.findOne(+id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateMonitoringDto: UpdateMonitoringDto) {
        return this.errorLogService.update(+id, updateMonitoringDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.errorLogService.remove(+id);
    }
}
