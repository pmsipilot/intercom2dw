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
        this.query = this.client.query.bind(this.client);
        this.logger = logger;
    }

    async connect() {
        if (!this.connected) {
            await this.client.connect();

            this.connected = true;
        }

        return this;
    }

    disconnect() {
        if (!this.connected) {
            return new Promise(resolve => resolve());
        }

        return this.client.end();
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

    fetchOutdatedUsers(companyIds = []) {
        const connection = this.connect();

        if ((companyIds instanceof Array ? companyIds : [companyIds]).length === 0) {
            return connection.then(() => this.query('SELECT * FROM outdated_user ORDER BY last_request_at DESC'));
        }

        const ids = `'${(companyIds instanceof Array ? companyIds : [companyIds]).join('\', \'')}'`;

        return connection.then(() => this.query(`
            SELECT * 
            FROM outdated_user 
            WHERE outdated_user.company_id IN(${ids}) 
            ORDER BY last_request_at DESC
        `));
    }

    fetchCompaniesUsers(companyIds = []) {
        const connection = this.connect();

        if ((companyIds instanceof Array ? companyIds : [companyIds]).length === 0) {
            return new Promise((resolve) => { resolve({ rows: [] }); });
        }

        const ids = `'${(companyIds instanceof Array ? companyIds : [companyIds]).join('\', \'')}'`;

        return connection.then(() => this.query(`
            SELECT "user".id, "user".user_id, "user".last_request_at 
            FROM "user" 
            JOIN user_company ON "user".id=user_company.user_id 
            JOIN company ON company.id=user_company.company_id 
            WHERE company.company_id IN(${ids})
        `));
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

    fetchCompaniesConversations(companyIds = []) {
        const connection = this.connect();

        if ((companyIds instanceof Array ? companyIds : [companyIds]).length === 0) {
            return this.fetchConversations();
        }

        const ids = `'${(companyIds instanceof Array ? companyIds : [companyIds]).join('\', \'')}'`;

        return connection.then(() => this.query(`
            SELECT conversation.* 
            FROM conversation 
            JOIN user_company ON "conversation"."user"=user_company.user_id 
            JOIN company ON company.id=user_company.company_id 
            WHERE company.company_id IN(${ids}) 
            ORDER BY conversation.updated_at DESC
        `));
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
