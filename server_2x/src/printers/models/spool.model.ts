import {ObjectID} from "typeorm";
import {FixedType} from "../../utils/types/fixed.type";

export interface SpoolModel {
    // TODO discuss key-value really necessary
    [k: string]: {
        toolName: string,
        spoolName: string,
        spoolId?: ObjectID, // TODO discuss fallback null or undefined
        volume: FixedType,
        length: FixedType,
        weight: FixedType,
        cost?: FixedType,
        type: string,
    }
}
