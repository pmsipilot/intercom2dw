const pg = require('pg').native;
const admins = require('./db/admins');
const companies = require('./db/companies');
const conversations = require('./db/conversations');
const conversationsRatings = require('./db/conversations_ratings');
const events = require('./db/events');
const leads = require('./db/leads');
const parts = require('./db/parts');
const segments = require('./db/segments');
const tags = require('./db/tags');
const users = require('./db/users');

const Client = pg.Client;

class Db {
    constructor(dsn, logger) {
        this.dsn = dsn;
        this.query = (...args) => this.connect()
            .then(async () => {
                const results = await this.client.query(...args);

                return this.disconnect()
                    .then(() => results);
            });
        this.logger = logger;
    }

    async connect() {
        if (!this.connected) {
            this.client = new Client(this.dsn);
            await this.client.connect();

            this.connected = true;
        }

        return this;
    }

    disconnect() {
        if (!this.connected) {
            return new Promise(resolve => resolve());
        }

        this.connected = false;

        return this.client.end();
    }

    saveAdmins(results) {
        this.logger.log('info', 'Saving admins');

        return admins.save(this.query, results, this.logger)
            .then(() => this.logger.log('info', 'Saved admins'));
    }

    saveCompanies(results) {
        this.logger.log('info', 'Saving companies');

        return companies.save(this.query, results)
            .then(() => this.logger.log('info', 'Saved companies'));
    }

    saveTags(results) {
        this.logger.log('info', 'Saving tags');

        return tags.save(this.query, results)
            .then(() => this.logger.log('info', 'Saved tags'));
    }

    saveSegments(results) {
        this.logger.log('info', 'Saving segments');

        return segments.save(this.query, results)
            .then(() => this.logger.log('info', 'Saved segments'));
    }

    saveLeads(results) {
        this.logger.log('info', 'Saving leads');

        return leads.save(this.query, results)
            .then(() => this.logger.log('info', 'Saved leads'));
    }

    saveUsers(results) {
        this.logger.log('info', 'Saving users');

        return users.save(this.query, results)
            .then(() => this.logger.log('info', 'Saved users'));
    }

    saveEvents(user, results) {
        this.logger.log('info', 'Saving user events');

        return events.save(this.query, user, results)
            .then(() => this.logger.log('info', 'Saved user events'));
    }

    saveConversations(results) {
        this.logger.log('info', 'Saving conversations');

        return conversations.save(this.query, results, this.logger)
            .then(() => this.logger.log('info', 'Saved conversations'));
    }

    saveConversationsRatings(conversation, ratings) {
        this.logger.log('info', 'Saving conversation rating');

        return conversationsRatings.save(this.query, conversation, ratings)
            .then(() => this.logger.log('info', 'Saved conversation ratings'));
    }

    saveParts(conversation, results) {
        this.logger.log('info', 'Saving conversation parts');

        return parts.save(this.query, conversation, results)
            .then(() => this.logger.log('info', 'Saved conversation parts'));
    }

    fetchOutdatedUsers(companyIds = []) {
        if ((companyIds instanceof Array ? companyIds : [companyIds]).length === 0) {
            return this.query('SELECT * FROM outdated_user ORDER BY last_request_at DESC');
        }

        const ids = `'${(companyIds instanceof Array ? companyIds : [companyIds]).join('\', \'')}'`;

        return this.query(`
            SELECT * 
            FROM outdated_user 
            WHERE outdated_user.company_id IN(${ids}) 
            ORDER BY last_request_at DESC
        `);
    }

    fetchCompaniesUsers(companyIds = []) {
        if ((companyIds instanceof Array ? companyIds : [companyIds]).length === 0) {
            return new Promise((resolve) => { resolve({ rows: [] }); });
        }

        const ids = `'${(companyIds instanceof Array ? companyIds : [companyIds]).join('\', \'')}'`;

        return this.query(`
            SELECT "user".id, "user".user_id, "user".last_request_at 
            FROM "user" 
            JOIN user_company ON "user".id=user_company.user_id 
            JOIN company ON company.id=user_company.company_id 
            WHERE company.company_id IN(${ids})
        `);
    }

    fetchConversations() {
        return this.query('SELECT * FROM conversation ORDER BY updated_at DESC');
    }

    fetchCompaniesConversations(companyIds = []) {
        if ((companyIds instanceof Array ? companyIds : [companyIds]).length === 0) {
            return this.fetchConversations();
        }

        const ids = `'${(companyIds instanceof Array ? companyIds : [companyIds]).join('\', \'')}'`;

        return this.query(`
            SELECT conversation.* 
            FROM conversation 
            JOIN user_company ON "conversation"."user"=user_company.user_id 
            JOIN company ON company.id=user_company.company_id 
            WHERE company.company_id IN(${ids}) 
            ORDER BY conversation.updated_at DESC
        `);
    }

    refreshLeadTags() {
        return this.query('REFRESH MATERIALIZED VIEW CONCURRENTLY lead_tag');
    }

    refreshUserTags() {
        return this.query('REFRESH MATERIALIZED VIEW CONCURRENTLY user_tag');
    }

    refreshConversationResponseTimes() {
        return this.query('REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_response_time');
    }

    refreshConversationPartResponseTimes() {
        return this.query('REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_part_response_time');
    }
}

module.exports = Db;
