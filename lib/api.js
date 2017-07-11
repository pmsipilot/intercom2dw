const fetch = require('node-fetch');
const admins = require('./api/admins');
const companies = require('./api/companies');
const conversations = require('./api/conversations');
const events = require('./api/events');
const leads = require('./api/leads');
const parts = require('./api/parts');
const segments = require('./api/segments');
const tags = require('./api/tags');
const users = require('./api/users');

function delayRequest(ms) {
    let delay = ms;

    if (!delay || delay <= 0) {
        delay = 500;
    }

    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
}

function delayUntilLimitReset(response) {
    let delay = 0;

    if (response && response.headers.get('X-RateLimit-Remaining') <= 0) {
        delay = (response.headers.get('X-RateLimit-Reset') * 1000) - Date.now();
    }

    return new Promise(async (resolve) => {
        await delayRequest(delay);

        resolve();
    });
}

class Api {
    constructor(url, id, token, logger) {
        this.url = url;
        this.auth = new Buffer(`${id}:${token}`).toString('base64');
        this.logger = logger;
        this.requests = 0;
    }

    async fetch(url, retry = 3) {
        const opts = {
            headers: {
                accept: 'application/json',
                authorization: `Basic ${this.auth}`,
            },
            timeout: 5000,
        };

        await delayUntilLimitReset(this.response);

        this.logger.log('debug', 'Sending request');
        this.logger.profile(`${this.url}${url}`);

        this.requests += 1;

        return fetch(`${this.url}${url}`, opts)
            .then(response => (this.response = response))
            .then(response => response.json())
            .then((json) => {
                this.logger.profile(`${this.url}${url}`);

                if (json.type === 'error.list') {
                    if (retry > 0) {
                        this.logger.log('warn', `Retrying due to error: ${json.errors[0].message}`);

                        return this.fetch(url, retry - 1);
                    }

                    throw new Error(json.errors[0].message);
                }

                return json;
            })
            .catch((error) => {
                this.logger.profile(`${this.url}${url}`);

                if (retry > 0) {
                    this.logger.log('warn', `Retrying due to error: ${error}`);

                    return this.fetch(url, retry - 1);
                }

                throw error;
            });
    }

    admins() {
        this.logger.log('info', 'Loading admins');

        return admins.fetch(this);
    }

    companies() {
        this.logger.log('info', 'Loading companies');

        return companies.fetch(this);
    }

    tags() {
        this.logger.log('info', 'Loading tags');

        return tags.fetch(this);
    }

    segments() {
        this.logger.log('info', 'Loading segments');

        return segments.fetch(this);
    }

    leads() {
        this.logger.log('info', 'Loading leads');

        return leads.fetch(this);
    }

    users() {
        this.logger.log('info', 'Loading users');

        return users.fetch(this);
    }

    events(user) {
        this.logger.log('info', 'Loading user events');

        return events.fetch(this, user);
    }

    conversations() {
        this.logger.log('info', 'Loading conversations');

        return conversations.fetch(this);
    }

    parts(conversation) {
        this.logger.log('info', 'Loading conversation parts');

        return parts.fetch(this, conversation);
    }
}

module.exports = Api;
