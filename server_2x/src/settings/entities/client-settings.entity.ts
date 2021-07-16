import {BeforeInsert, BeforeUpdate, Column, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {IsDefined, validate} from "class-validator";
import {ValidationException} from "../../providers/validation.exception";
import {ClientDashboardSettings} from "../models/client-dashboard/client-dashboard.settings";

@Entity()
export class ClientSettings {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    @IsDefined()
    dashboard: ClientDashboardSettings; // TODO model

    @Column()
    panelView: any = {}; // TODO model

    @Column()
    listView: any = {}; // TODO model

    @Column()
    cameraView: any = {}; // TODO model;

    @Column()
    controlSettings: any = {}; // TODO model;

    constructor(partialInput?: Partial<ClientSettings>) {
        partialInput && Object.assign(this, partialInput);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, ClientSettings.name);
    }
}