import {IsDefined, validate} from "class-validator";
import {BeforeInsert, BeforeUpdate, Column, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {ValidationException} from "../../providers/validation.exception";

@Entity()
export class Filament {
    @ObjectIdColumn()
    id: ObjectID;

    // TODO shouldnt this be navigation to an entity called PrinterFilament (m2m)?

    // TODO model + constrain/defaults
    @Column()
    @IsDefined()
    spools: any;

    constructor(partialPrinter?: Partial<Filament>) {
        partialPrinter && Object.assign(this, partialPrinter);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, Filament.name);
    }
}