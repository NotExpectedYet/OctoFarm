import {IsDate, IsDefined, validate} from "class-validator";
import {BeforeInsert, BeforeUpdate, Column, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {ValidationException} from "../../providers/validation.exception";

// TODO PrinterRoomData table limit/cap needs to be enforced at a higher lvl
// QueryRunner or Migrations https://github.com/typeorm/typeorm/issues/5187
@Entity()
export class PrinterTempHistory {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    @IsDefined()
    @IsDate()
    date: Date;

    // TODO model + constrain/default
    @Column()
    currentTemp: any;

    // TODO make foreign key one to many constrained, migration printer_id to printerId
    @ObjectIdColumn()
    @IsDefined()
    printerId: ObjectID;

    constructor(partialPrinter?: Partial<PrinterTempHistory>) {
        partialPrinter && Object.assign(this, partialPrinter);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, PrinterTempHistory.name);
    }
}