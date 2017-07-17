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

    saveAdmins(results) {
        this.logger.log('info', 'Saving admins');

        return this.connect()
            .then(() => admins.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved admins'));
    }

    saveCompanies(results) {
        this.logger.log('info', 'Saving companies');

        return this.connect()
            .then(() => companies.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved companies'));
    }

    saveTags(results) {
        this.logger.log('info', 'Saving tags');

        return this.connect()
            .then(() => tags.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved tags'));
    }

    saveSegments(results) {
        this.logger.log('info', 'Saving segments');

        return this.connect()
            .then(() => segments.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved segments'));
    }

    saveLeads(results) {
        this.logger.log('info', 'Saving leads');

        return this.connect()
            .then(() => leads.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved leads'));
    }

    refreshLeadTags() {
        return this.connect()
            .then(() => this.query('REFRESH MATERIALIZED VIEW CONCURRENTLY lead_tag'));
    }

    saveUsers(results) {
        this.logger.log('info', 'Saving users');

        return this.connect()
            .then(() => users.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved users'));
    }

    refreshUserTags() {
        return this.connect()
            .then(() => this.query('REFRESH MATERIALIZED VIEW CONCURRENTLY user_tag'));
    }

    fetchOutdatedUsers() {
        return this.connect()
            .then(() => this.query('SELECT * FROM outdated_user ORDER BY last_request_at DESC'));
    }

    saveEvents(user, results) {
        this.logger.log('info', 'Saving user events');

        return this.connect()
            .then(() => events.save(this.query, user, results))
            .then(() => this.logger.log('info', 'Saved user events'));
    }

    saveConversations(results) {
        this.logger.log('info', 'Saving conversations');

        return this.connect()
            .then(() => conversations.save(this.query, results))
            .then(() => this.logger.log('info', 'Saved conversations'));
    }

    refreshConversationResponseTimes() {
        return this.connect()
            .then(() => this.query('REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_response_time'));
    }

    fetchConversations() {
        return this.connect()
            .then(() => this.query('SELECT * FROM conversation ORDER BY updated_at DESC'));
    }

    saveParts(conversation, results) {
        this.logger.log('info', 'Saving conversation parts');

        return this.connect()
            .then(() => parts.save(this.query, conversation, results))
            .then(() => this.logger.log('info', 'Saved conversation parts'));
    }

    refreshConversationPartResponseTimes() {
        return this.connect()
            .then(() => this.query('REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_part_response_time'));
    }
}

module.exports = Db;
