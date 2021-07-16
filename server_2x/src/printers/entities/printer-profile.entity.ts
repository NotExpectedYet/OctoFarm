import {validate} from "class-validator";
import {BeforeInsert, BeforeUpdate, Column, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {ValidationException} from "../../providers/validation.exception";

@Entity()
export class PrinterProfile {
    @ObjectIdColumn()
    id: ObjectID;

    // TODO model + constrain/defaults
    @Column()
    profile: any;

    constructor(partialPrinter?: Partial<PrinterProfile>) {
        partialPrinter && Object.assign(this, partialPrinter);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, PrinterProfile.name);
    }
}