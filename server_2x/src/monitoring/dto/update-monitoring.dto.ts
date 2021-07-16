import { PartialType } from '@nestjs/mapped-types';
import { CreateMonitoringDto } from './create-monitoring.dto';

export class UpdateMonitoringDto extends PartialType(CreateMonitoringDto) {}
