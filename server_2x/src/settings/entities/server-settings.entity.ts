import {BeforeInsert, BeforeUpdate, Column, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {IsDefined, validate} from "class-validator";
import {ValidationException} from "../../providers/validation.exception";
import {OnlinePollingModel} from "../models/online-polling.model";
import {ServerModel} from "../models/server/server.model";

@Entity()
export class ServerSettings {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    @IsDefined()
    onlinePolling: OnlinePollingModel; // TODO finish model

    @Column()
    server: ServerModel = { // TODO finish model
        registration: true,
        port: 4000, // Not fetched/applied...
        loginRequired: true
    };

    @Column()
    timeout: any = {}; // TODO model

    @Column()
    filamentManager: boolean;

    @Column()
    filament: any = {}; // TODO model;

    @Column()
    history: any = {}; // TODO model;

    @Column()
    influxExport: any = {}; // TODO model;

    constructor(partialInput?: Partial<ServerSettings>) {
        partialInput && Object.assign(this, partialInput);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, ServerSettings.name);
    }
}