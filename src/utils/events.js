export class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        return this;
    }

    once(event, callback) {
        const onceWrapper = (...args) => {
            callback.apply(this, args);
            this.off(event, onceWrapper);
        };
        return this.on(event, onceWrapper);
    }

    emit(event, ...args) {
        if (!this.events[event]) {
            return false;
        }
        this.events[event].forEach(callback => callback.apply(this, args));
        return true;
    }

    off(event, callback) {
        if (!this.events[event]) {
            return this;
        }
        if (!callback) {
            delete this.events[event];
            return this;
        }
        this.events[event] = this.events[event].filter(cb => cb !== callback);
        return this;
    }

    removeAllListeners() {
        this.events = {};
        return this;
    }

    addListener(event, callback) {
        return this.on(event, callback);
    }

    removeListener(event, callback) {
        return this.off(event, callback);
    }
}