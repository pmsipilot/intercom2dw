class Trampoline {
    constructor(fn) {
        this.fn = fn;
        this.listeners = [];
    }

    onBounce(fn) {
        this.listeners.push(fn);

        return this;
    }

    async emit(data) {
        for (const listener of this.listeners) {
            await listener(data);
        }
    }

    async jump() {
        let [trampoline, current] = await this.fn();

        while (typeof trampoline === 'function') {
            if (current) {
                await this.emit(current);
            }

            [trampoline, current] = await trampoline();
        }

        if (current) {
            await this.emit(current);
        }
    }
}

module.exports = Trampoline;
