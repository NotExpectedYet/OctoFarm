import {IsAlphanumeric, IsNotEmpty, Length, validateSync} from "class-validator";
import {ApiKeyLengthMinimumDefault} from "../../printers/printers.config";

export class RestConnectionParams {
    @IsNotEmpty()
    printerURL: string;

    @Length(ApiKeyLengthMinimumDefault)
    @IsAlphanumeric()
    printerKey: string;

    constructor(printerURL, printerKey) {
        this.printerURL = printerURL;
        this.printerKey = printerKey;
    }

    // This make sure we cant pass interface types - dont remove
    public validateParams() {
        return validateSync(this);
    }
}