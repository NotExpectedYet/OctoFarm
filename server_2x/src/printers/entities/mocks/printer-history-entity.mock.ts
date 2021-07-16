import {PrinterHistory} from "../printer-history.entity";

export class PrinterHistoryEntityMock {
    history: PrinterHistory[] = [];

    setHistory(history) {
        this.history = history;
    }

    find() {
        return Promise.resolve(this.history);
    }

    findOne() {
        return this.history[0];
    };

    save() {
        return Promise.resolve()
    }
}
