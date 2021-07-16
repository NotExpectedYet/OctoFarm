import {Column, CreateDateColumn, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {IsDate} from "class-validator";

@Entity()
export class FarmStatistics {
    @ObjectIdColumn()
    id: ObjectID;

    // TODO check constraint
    @Column()
    @CreateDateColumn()
    @IsDate()
    farmStart: Date;

    // TODO model and constrain
    @Column()
    heatMap: any;
}
