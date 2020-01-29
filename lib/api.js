const dnscache = require('dnscache');
const fetch = require('node-fetch');
const admins = require('./api/admins');
const companies = require('./api/companies');
const conversations = require('./api/conversations');
const events = require('./api/events');
const leads = require('./api/leads');
const detail = require('./api/conversations_detail');
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

function delayUntilLimitReset(logger, response) {
    let delay = 0;

    if (response) {
        const remaining = response.headers.get('X-RateLimit-Remaining');

        logger.log('debug', `Remaining requests until limit resets: ${remaining}`);
        logger.log('debug', `Limit will reset at: ${new Date(response.headers.get('X-RateLimit-Reset') * 1000)}`);

        if (remaining <= 0) {
            delay = (response.headers.get('X-RateLimit-Reset') * 1000) - Date.now();
        }
    }

    return new Promise(async (resolve) => {
        await delayRequest(delay);

        resolve();
    });
}

class Api {
    constructor(url, id, token, logger) {
        this.url = url;

        if (id) {
            this.auth = `Basic ${new Buffer(`${id}:${token}`).toString('base64')}`;
        } else {
            this.auth = `Bearer ${token}`;
        }

        this.logger = logger;
        this.requests = 0;

        dnscache({
            enable: true,
            ttl: 600000,
            cachesize: 1000,
        });
    }

    async fetch(url, retry = 3) {
        const opts = {
            headers: {
                accept: 'application/json',
                authorization: this.auth,
            },
            timeout: 10000,
        };

        await delayUntilLimitReset(this.logger, this.lastResponse);

        this.logger.log('debug', 'Sending request');
        this.logger.profile(`${this.url}${url}`);

        this.requests += 1;

        return fetch(`${this.url}${url}`, opts)
            .then(response => (this.lastResponse = response))
            .then(response => response.json())
            .then(async (json) => {
                this.logger.profile(`${this.url}${url}`);

                if (json.type === 'error.list') {
                    if (retry > 0) {
                        this.logger.log('warn', `Retrying due to error: ${json.errors[0].message}`);

                        await delayRequest(5000);

                        return this.fetch(url, retry - 1);
                    }

                    throw new Error(json.errors[0].message);
                }

                return json;
            })
            .catch(async (error) => {
                this.logger.profile(`${this.url}${url}`);

                if (retry > 0) {
                    this.logger.log('warn', `Retrying due to error: ${error}`);

                    await delayRequest(5000);

                    return this.fetch(url, retry - 1);
                }

                throw error;
            });
    }

    admins() {
        this.logger.log('info', 'Loading admins');

        return admins.fetch(this);
    }

    companies(list = []) {
        this.logger.log('info', 'Loading companies');

        return companies.fetch(this, list instanceof Array ? list : [list]);
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

    users(list = []) {
        this.logger.log('info', 'Loading users');

        return users.fetch(this, list instanceof Array ? list : [list]);
    }

    events(user) {
        this.logger.log('info', 'Loading user events');

        return events.fetch(this, user);
    }

    conversations(authors = []) {
        this.logger.log('info', 'Loading conversations');

        return conversations.fetch(this, authors);
    }

    conversationDetails(conversation) {
        this.logger.log('info', 'Loading conversation details');

        return detail.fetch(this, conversation);
    }
}

module.exports = Api;
