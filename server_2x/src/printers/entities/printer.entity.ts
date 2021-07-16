import {IsAlphanumeric, IsNumber, Length, validate} from "class-validator";
import {BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {ValidationException} from "../../providers/validation.exception";
import {ApiKeyLengthMinimumDefault} from "../printers.config";

@Entity()
export class Printer {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    name: string;

    // TODO purpose not clear w.r.t. old 'group'
    @Column()
    category: string;

    // TODO Migration from 'dateAdded' which is type unicode timestamp => discuss
    @CreateDateColumn()
    creationTime: Date;

    // TODO purpose not clear, unusual type - unless unix timestamp?
    @Column()
    currentIdle: number;

    // TODO purpose not clear, unusual type - unless unix timestamp?
    @Column()
    currentOffline: number;

    // TODO refactor into enum - otherwise disregard and remove this TODO
    @Column()
    type: string;

    // TODO define sortIndex constraints (IsPositive, contextual IsDefined)
    @Column()
    @IsNumber()
    sortIndex: number;

    // TODO sanitize ip, define strict type/regex, triage duplication vs printerURL
    @Column()
    ip: string;

    // TODO sanitize port, type number instead, triage duplication vs printerURL
    @Column()
    port: string;

    // TODO constrain length limits (verify OP settings)
    @Column()
    @IsAlphanumeric()
    @Length(ApiKeyLengthMinimumDefault)
    apiKey: string;

    // TODO Sanitize URL - allow default empty
    @Column()
    camURL: string;

    // TODO check if semver constrained, make OF-service readonly
    @Column()
    octoPrintVersion: string;

    // TODO Should be in object (its optional), check if semver constrained
    @Column()
    klipperFirmwareVersion: string;

    // TODO Should be in object (its octoprint settings), check type (double/int)
    @Column()
    feedRate: number;

    // TODO Should be in object (its octoprint settings), check type (double/int)
    @Column()
    flowRate: number;

    // TODO migate typo 'settingsApperance' to 'settingsAppearance', create model with optionals/constraints
    @Column()
    settingsAppearance: any;

    // TODO create model with optionals/constraints
    @Column()
    selectedFilament: any;

    // TODO EH? Wut? Why a name, is this the creator? Use foreign key + ID column pls + name this appropriately
    @Column()
    currentUser: string;

    /**
     * @deprecated group has been inflated to printerGroups
     */
    @Column()
    group: string;

    // TODO model + constrain/readonly OF-service
    @Column()
    tempTriggers: any;

    // TODO model + constrain/readonly OF-service
    @Column()
    powerSettings: any;

    // TODO model + constrain/readonly OF-service
    @Column()
    costSettings: any;

    // TODO model + change to array type + constrain/readonly OF-service
    @Column()
    fileList: any;

    // TODO model + triage relevance or naming
    @Column()
    storage: any;

    constructor(partialPrinter?: Partial<Printer>) {
        partialPrinter && Object.assign(this, partialPrinter);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, Printer.name);
    }
}