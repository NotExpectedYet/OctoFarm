import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
    @IsNotEmpty()
    @IsString()
    readonly username: string;

    @IsNotEmpty()
    @IsString()
    readonly password: string;
}