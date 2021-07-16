import {IsNotEmpty, validate} from "class-validator";
import {BeforeInsert, BeforeUpdate, Column, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {ValidationException} from "../../providers/validation.exception";

// TODO unused? Also, should this go to fileManagement module? File management can be daunting.
@Entity()
export class CustomGCode {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    @IsNotEmpty()
    name: string;

    @Column()
    @IsNotEmpty()
    description: string;

    // TODO migrated from name 'gcode' to 'gCode', migrated type
    @Column()
    gCode: string[];

    constructor(partialPrinter?: Partial<CustomGCode>) {
        partialPrinter && Object.assign(this, partialPrinter);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, CustomGCode.name);
    }
}