export class AuthMessage {
    auth: string;

    constructor(username: string, sessionKey: string) {
        this.auth = `${username}:${sessionKey}`;
    }

    validateAuth() {
        return this.auth.includes(':');
    }
}