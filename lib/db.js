const util = require('util');
const pg = require('pg').native;
const admins = require('./db/admins');
const companies = require('./db/companies');
const conversations = require('./db/conversations');
const events = require('./db/events');
const leads = require('./db/leads');
const parts = require('./db/parts');
const segments = require('./db/segments');
const tags = require('./db/tags');
const users = require('./db/users');

const Client = pg.Client;

class Db {
    constructor(dsn, logger) {
        this.client = new Client(dsn);
        this.query = util.promisify(this.client.query).bind(this.client);
        this.logger = logger;
    }

    async connect() {
        if (!this.connected) {
            const connect = util.promisify(this.client.connect.bind(this.client));

            await connect();

            this.connected = true;
        }

        return this;
    }

    disconnect() {
        if (!this.connected) {
            return;
        }

        const end = util.promisify(this.client.end.bind(this.client));

        end();
    }

    admins(results) {
        this.logger.log('info', 'Saving admins');

        return this.connect()
            .then(() => admins.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved admins'));
    }

    companies(results) {
        this.logger.log('info', 'Saving companies');

        return this.connect()
            .then(() => companies.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved companies'));
    }

    tags(results) {
        this.logger.log('info', 'Saving tags');

        return this.connect()
            .then(() => tags.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved tags'));
    }

    segments(results) {
        this.logger.log('info', 'Saving segments');

        return this.connect()
            .then(() => segments.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved segments'));
    }

    leads(results) {
        this.logger.log('info', 'Saving leads');

        return this.connect()
            .then(() => leads.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved leads'));
    }

    users(results) {
        this.logger.log('info', 'Saving users');

        return this.connect()
            .then(() => users.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved users'));
    }

    events(user, results) {
        this.logger.log('info', 'Saving user events');

        return this.connect()
            .then(() => events.save(this.query, user, results))
            .then(() => this.logger.log('info', 'Saved user events'));
    }

    conversations(results) {
        this.logger.log('info', 'Saving conversations');

        return this.connect()
            .then(() => conversations.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved conversations'));
    }

    parts(conversation, results) {
        this.logger.log('info', 'Saving conversation parts');

        return this.connect()
            .then(() => parts.save(this.query, conversation, results))
            .then(() => this.logger.log('info', 'Saved conversation parts'));
    }
}

module.exports = Db;
