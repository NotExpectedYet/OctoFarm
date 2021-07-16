import {IsNotEmpty, IsString, MinLength} from "class-validator";
import {Matches} from "../../utils/validations.util";
import {nameof} from "../../utils/property-reflection.util";
import {UserConstants} from "../users.constants";

export class RegisterInputDto {
    @IsNotEmpty()
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
    @IsString()
    @Matches(nameof<RegisterInputDto>("password"))
    password2: string;
}