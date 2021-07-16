import {PartialType} from '@nestjs/mapped-types';
import {CreateUserDto} from './create-user.dto';
import {IsEnum, IsNotEmpty} from "class-validator";
import {GroupEnum} from "../types/group.enum";

export class UpdateUserDto extends PartialType(CreateUserDto) {
    name: string;

    @IsNotEmpty()
    username: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    @IsEnum(GroupEnum)
    group: GroupEnum = GroupEnum.User;
}
