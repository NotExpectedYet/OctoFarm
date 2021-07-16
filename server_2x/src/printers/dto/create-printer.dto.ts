import {IsAlphanumeric, IsNotEmpty, IsNotEmptyObject, IsNumber, Length} from "class-validator";
import {ApiKeyLengthMinimumDefault} from "../printers.config";

export class CreatePrinterDto {
    @Length(ApiKeyLengthMinimumDefault)
    @IsAlphanumeric()
    apiKey: string;

    group: string;

    @IsNotEmpty()
    printerUrl: string;

    @IsNotEmptyObject()
    settingsAppearance: any;

    @IsNumber()
    sortIndex: number;
}