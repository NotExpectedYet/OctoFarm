import {IsDefined, validate} from "class-validator";
import {BeforeInsert, BeforeUpdate, Column, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {ValidationException} from "../../providers/validation.exception";

@Entity()
export class PrinterHistory {
    @ObjectIdColumn()
    id: ObjectID;

    // TODO no printer Id one-to-many foreignKey?

    // TODO model + constrain/defaults
    @Column()
    @IsDefined()
    printHistory: any;

    constructor(partialPrinter?: Partial<PrinterHistory>) {
        partialPrinter && Object.assign(this, partialPrinter);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, PrinterHistory.name);
    }
}