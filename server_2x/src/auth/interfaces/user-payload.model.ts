import {ObjectID} from "typeorm";

export class UserPayload {
    id: ObjectID;
    username: string;
}