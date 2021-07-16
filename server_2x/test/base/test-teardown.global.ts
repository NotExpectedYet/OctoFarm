import {getUrl, stop} from "mongo-unit";

export default async () => {
    console.log('DB teardown', getUrl());
    await stop();
    console.log('DB stopped');
}