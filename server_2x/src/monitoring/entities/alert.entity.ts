import {Column, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {IsDefined, IsNotEmpty} from "class-validator";

@Entity()
export class Alert {
    @ObjectIdColumn()
    id: ObjectID;

    // TODO please rename or contextualize with jsDoc
    @Column()
    @IsDefined()
    active: boolean;

    // TODO model foreign key m2m + cascade deletion
    @Column()
    @IsDefined()
    printer: any[];

    // TODO model instead of string... this could too fluid
    @Column()
    @IsNotEmpty()
    trigger: string;

    // TODO Should define min/max length constant and propagate to frontend
    @Column()
    @IsNotEmpty()
    message: string;

    // TODO Should use media file management module instead to keep unique URLS + valid file paths
    @Column()
    @IsNotEmpty()
    scriptLocation: string;
}
