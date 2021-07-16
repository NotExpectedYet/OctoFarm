import {Body, Controller, Delete, Get, Param, Post, Put} from '@nestjs/common';
import {CreateMonitoringDto} from '../dto/create-monitoring.dto';
import {UpdateMonitoringDto} from '../dto/update-monitoring.dto';
import {ApiTags} from "@nestjs/swagger";
import {AlertsService} from "../services/alerts.service";

@Controller('alerts')
@ApiTags(AlertsController.name)
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) {
    }

    @Post()
    create(@Body() createMonitoringDto: CreateMonitoringDto) {
        return this.alertsService.create(createMonitoringDto);
    }

    @Get()
    findAll() {
        return this.alertsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.alertsService.findOne(+id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateMonitoringDto: UpdateMonitoringDto) {
        return this.alertsService.update(+id, updateMonitoringDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.alertsService.remove(+id);
    }
}
