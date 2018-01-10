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

    profile(id, msg, meta, callback) {
        const info = this.info;

        this.info = (infoMsg, infoMeta, infoCallback) => {
            this.log('debug', infoMsg, infoMeta, infoCallback);
        };

        const ret = super.profile(id, msg, meta, callback);

        this.info = info;

        return ret;
    }
}

module.exports = Logger;
