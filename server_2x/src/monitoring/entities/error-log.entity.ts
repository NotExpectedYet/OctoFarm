import {Column, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {IsDefined} from "class-validator";

@Entity()
export class ErrorLog {
    @ObjectIdColumn()
    id: ObjectID;

    // TODO model this
    @Column()
    @IsDefined()
    errorLog: any;
}
