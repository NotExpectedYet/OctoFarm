import {IsArray, IsDefined, validate} from "class-validator";
import {BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {ValidationException} from "../../providers/validation.exception";

@Entity()
export class PrinterGroup {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    name: string;

    @CreateDateColumn()
    creationTime: Date;

    @Column()
    @IsArray()
    // @MinLength(1) gotta have fallback if we go minimum 1
    @IsDefined({each: true})
    printers: ObjectID[] = [];

    // TODO OOOOH INTERESTING THOUGHT - do consider negative effect (chaos)
    // @Column()
    // apiKey: string;

    constructor(partialPrinter?: Partial<PrinterGroup>) {
        partialPrinter && Object.assign(this, partialPrinter);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, PrinterGroup.name);
    }
}