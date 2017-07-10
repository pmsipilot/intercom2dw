const winston = require('winston');
const { Console } = require('winston').transports;

class Logger extends winston.Logger {
    constructor(opts) {
        const defaults = {
            transports: [
                new Console({
                    formatter: (options) => {
                        const prefix = `${new Date()} - ${options.level.toUpperCase()}`;
                        const message = options.message ? options.message : '';
                        const meta = options.meta && Object.keys(options.meta).length
                            ? JSON.stringify(options.meta)
                            : '';

                        return `${prefix} - ${message} - ${meta}`;
                    },
                }),
            ],
        };

        super(Object.assign({}, defaults, opts));
    }

    profile(id) {
        const info = this.info;

        this.info = (msg, meta, callback) => {
            this.log('debug', msg, meta, callback);
        };

        const ret = super.profile(id);

        this.info = info;

        return ret;
    }
}

module.exports = Logger;
