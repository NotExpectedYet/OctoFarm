import {IsEnum, IsNotEmpty, IsString, MinLength} from "class-validator";
import {GroupEnum} from "../types/group.enum";
import {UserConstants} from "../users.constants";

export class CreateUserDto {
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(UserConstants.usernameLengthMinimum)
    username: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(UserConstants.passwordLengthMinimum)
    password: string;

    @IsNotEmpty()
    @IsEnum(GroupEnum)
    group: GroupEnum = GroupEnum.User;
}
