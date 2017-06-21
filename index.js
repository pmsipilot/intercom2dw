const { Logger } = require('winston');
const { Console } = require('winston').transports;
const Api = require('./lib/api');
const Db = require('./lib/db');

const logger = new Logger({
    transports: [
        new Console({
            level: 'debug',
            formatter: (options) => {
                const prefix = `${new Date()} - ${options.level.toUpperCase()}`;
                const message = options.message ? options.message : '';
                const meta = options.meta && Object.keys(options.meta).length ? JSON.stringify(options.meta) : '';

                return `${prefix} - ${message} - ${meta}`;
            },
        }),
    ],
});

const profile = logger.profile.bind(logger);

logger.profile = (id) => {
    const info = logger.info;

    logger.info = (msg, meta, callback) => {
        logger.log('debug', msg, meta, callback);
    };

    const ret = profile(id);

    logger.info = info;

    return ret;
};

const api = new Api('https://api.intercom.io', 'zooz4av1', '8514bf47c9d9cf8f4357b616dad1a18ba4c1ba34', logger);
const db = new Db('postgres://intercom2db:intercom2db@db:5432/intercom2db', logger);

db.connect()
    .then(() => api.tags()
        .onBounce(tags => logger.log('info', `Got ${tags.length} tags`))
        .onBounce(tags => db.tags(tags))
        .jump(),
    )
    .then(() => logger.log('info', 'Done loading tags'))
    .then(() => api.segments()
        .onBounce(segments => logger.log('info', `Got ${segments.length} segments`))
        .onBounce(segments => db.segments(segments))
        .jump(),
    )
    .then(() => logger.log('info', 'Done loading segments'))
    .then(() => api.admins()
        .onBounce(admins => logger.log('info', `Got ${admins.length} admins`))
        .onBounce(admins => db.admins(admins))
        .jump(),
    )
    .then(() => logger.log('info', 'Done loading admins'))
    .then(() => api.companies()
        .onBounce(companies => logger.log('info', `Got ${companies.length} companies`))
        .onBounce(companies => db.companies(companies))
        .jump(),
    )
    .then(() => logger.log('info', 'Done loading companies'))
    .then(() => api.leads()
        .onBounce(leads => logger.log('info', `Got ${leads.length} leads`))
        .onBounce(leads => db.leads(leads))
        .jump(),
    )
    .then(() => db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY lead_tag'))
    .then(() => logger.log('info', 'Done loading leads'))
    .then(() => api.users()
        .onBounce(users => logger.log('info', `Got ${users.length} users`))
        .onBounce(users => db.users(users))
        .jump(),
    )
    .then(() => db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY user_tag'))
    .then(() => logger.log('info', 'Done loading users'))
    .then(() => db.query('SELECT * FROM outdated_user ORDER BY last_request_at DESC'))
    .then(async (results) => {
        let i = 0;

        for (const user of results.rows) {
            logger.log('info', `Loading events for user ${i += 1} of ${results.rows.length}`);

            await api.events(user.id)
                .onBounce(events => logger.log('info', `Got ${events.length} events`))
                .onBounce(events => db.events(user, events))
                .jump();
        }
    })
    .then(() => logger.log('info', 'Done loading user events'))
    .then(() => api.conversations()
        .onBounce(conversations => logger.log('info', `Got ${conversations.length} conversations`))
        .onBounce(conversations => db.conversations(conversations))
        .jump(),
    )
    .then(() => db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_response_time'))
    .then(() => logger.log('info', 'Done loading conversations'))
    .then(() => db.query('SELECT * FROM conversation ORDER BY updated_at DESC'))
    .then(async (results) => {
        let i = 0;

        for (const conversation of results.rows) {
            logger.log('info', `Loading parts for conversation ${i += 1} of ${results.rows.length}`);

            await api.parts(conversation.id)
                .onBounce(parts => logger.log('info', `Got ${parts.length} parts`))
                .onBounce(parts => db.parts(conversation, parts))
                .jump();
        }
    })
    .then(() => db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_part_response_time'))
    .then(() => logger.log('info', 'Done loading conversation parts'))
    .then(() => db.disconnect())
    .catch((err) => {
        logger.log('error', err);

        db.disconnect();
    });
