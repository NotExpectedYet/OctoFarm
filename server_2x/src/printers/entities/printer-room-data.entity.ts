import {IsDate, IsDefined, validate} from "class-validator";
import {BeforeInsert, BeforeUpdate, Column, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {ValidationException} from "../../providers/validation.exception";

// TODO unused?
@Entity()
export class PrinterRoomData {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    @IsDefined()
    @IsDate()
    date: Date;

    @Column()
    temperature: number;

    @Column()
    pressure: number;

    @Column()
    humidity: number;

    @Column()
    iaq: number;

    constructor(partialPrinter?: Partial<PrinterRoomData>) {
        partialPrinter && Object.assign(this, partialPrinter);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, PrinterRoomData.name);
    }
}