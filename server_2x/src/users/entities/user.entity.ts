import {BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, ObjectID, ObjectIdColumn} from "typeorm";
import {IsNotEmpty, MinLength, validate} from "class-validator";
import {ValidationException} from "../../providers/validation.exception";
import {UserConstants} from "../users.constants";
import {GroupEnum} from "../types/group.enum";

@Entity()
export class User {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    @IsNotEmpty()
    name: string;

    @Column({unique: true})
    @IsNotEmpty()
    @MinLength(UserConstants.usernameLengthMinimum)
    username: string;

    @IsNotEmpty()
    @Column()
    passwordHash: string;

    // TODO migrated from 'date' to 'creationTime'
    @CreateDateColumn()
    creationTime: Date;

    // TODO Inflate to proper role table
    @Column()
    @IsNotEmpty()
    group: GroupEnum;

    constructor(partialUser?: Partial<User>) {
        partialUser && Object.assign(this, partialUser);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        const errors = await validate(this);
        if (!!errors && errors.length > 0)
            throw new ValidationException(errors, User.name);
    }
}