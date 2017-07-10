const caporal = require('caporal');
const metadata = require('./package.json');
const Api = require('./lib/api');
const Db = require('./lib/db');
const Logger = require('./lib/logger');
const consts = require('./lib/consts');

caporal
    .logger(new Logger())
    .name(metadata.name)
    .version(metadata.version)
    .description(metadata.description);

caporal
    .argument('[app-id]', 'Application ID', null, process.env.INTERCOM2DW_APP_ID)
    .argument('[app-token]', 'Application token', null, process.env.INTERCOM2DW_APP_TOKEN)
    .option('--intercom-api-url', 'Intercom API URL', null, process.env.INTERCOM2DW_API_URL || 'https://api.intercom.io')
    .option('--db-host', 'Postgres database host', null, process.env.INTERCOM2DW_DB_HOST || 'db')
    .option('--db-port', 'Postgres database port', caporal.INT, process.env.INTERCOM2DW_DB_HOST || 5432)
    .option('--db-user', 'Postgres database username', null, process.env.INTERCOM2DW_DB_USER || 'intercom2dw')
    .option('--db-password', 'Postgres database password', null, process.env.INTERCOM2DW_DB_PASSWORD || 'intercom2dw')
    .option('--db-name', 'Postgres database name', null, process.env.INTERCOM2DW_DB_NAME || 'intercom2dw')
    .option('--no-tags', 'Do not load tags (implies --no-users and --no-companies)')
    .option('--no-segments', 'Do not load segments (implies --no-users and --no-companies)')
    .option('--no-admins', 'Do not load admins (implies --no-conversations and --no-conversation-parts)')
    .option('--no-companies', 'Do not load companies (implies --no-users and --no-leads)')
    .option('--no-leads', 'Do not load leads (implies --no-conversations and --no-conversation-parts)')
    .option('--no-users', 'Do not load users (implies --no-conversations, --no-conversation-parts and --no-events)')
    .option('--no-events', 'Do not load events')
    .option('--no-conversations', 'Do not load conversations')
    .option('--no-conversation-parts', 'Do not load conversation parts')
    .action((args, options, logger) => {
        const api = new Api(options.intercomApiUrl, args.appId, args.appToken, logger);
        const { dbUser, dbPassword, dbHost, dbPort, dbName } = options;
        const db = new Db(`postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`, logger);
        let blacklist = 0;

        if (options.noTags) {
            blacklist |= consts.IGNORE_TAGS;
        }

        if (options.noSegments) {
            blacklist |= consts.IGNORE_SEGMENTS;
        }

        if (options.noAdmins) {
            blacklist |= consts.IGNORE_ADMINS;
        }

        if (options.noCompanies) {
            blacklist |= consts.IGNORE_COMPANIES;
        }

        if (options.noLeads) {
            blacklist |= consts.IGNORE_LEADS;
        }

        if (options.noUsers) {
            blacklist |= consts.IGNORE_USERS;
        }

        db.connect()
            .then(() => !(blacklist & consts.TAGS) && api.tags()
                .onBounce(tags => logger.log('info', `Got ${tags.length} tags`))
                .onBounce(tags => db.tags(tags))
                .jump()
                .then(() => logger.log('info', 'Done loading tags')),
            )
            .then(() => !(blacklist & consts.SEGMENTS) && api.segments()
                .onBounce(segments => logger.log('info', `Got ${segments.length} segments`))
                .onBounce(segments => db.segments(segments))
                .jump()
                .then(() => logger.log('info', 'Done loading segments')),
            )
            .then(() => !(blacklist & consts.ADMINS) && api.admins()
                .onBounce(admins => logger.log('info', `Got ${admins.length} admins`))
                .onBounce(admins => db.admins(admins))
                .jump()
                .then(() => logger.log('info', 'Done loading admins')),
            )
            .then(() => !(blacklist & consts.COMPANIES) && api.companies()
                .onBounce(companies => logger.log('info', `Got ${companies.length} companies`))
                .onBounce(companies => db.companies(companies))
                .jump()
                .then(() => logger.log('info', 'Done loading companies')),
            )
            .then(() => !(blacklist & consts.LEADS) && api.leads()
                .onBounce(leads => logger.log('info', `Got ${leads.length} leads`))
                .onBounce(leads => db.leads(leads))
                .jump()
                .then(() => db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY lead_tag'))
                .then(() => logger.log('info', 'Done loading leads')),
            )
            .then(() => !(blacklist & consts.USERS) && api.users()
                .onBounce(users => logger.log('info', `Got ${users.length} users`))
                .onBounce(users => db.users(users))
                .jump()
                .then(() => db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY user_tag'))
                .then(() => logger.log('info', 'Done loading users')),
            )
            .then(() => !(blacklist & consts.EVENTS) && db.query('SELECT * FROM outdated_user ORDER BY last_request_at DESC')
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
                .then(() => logger.log('info', 'Done loading user events')),
            )
            .then(() => !(blacklist & consts.CONVERSATIONS) && api.conversations()
                .onBounce(conversations => logger.log('info', `Got ${conversations.length} conversations`))
                .onBounce(conversations => db.conversations(conversations))
                .jump()
                .then(() => db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_response_time'))
                .then(() => logger.log('info', 'Done loading conversations')),
            )
            .then(() => !(blacklist & consts.PARTS) && db.query('SELECT * FROM conversation ORDER BY updated_at DESC')
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
                .then(() => logger.log('info', 'Done loading conversation parts')),
            )
            .then(() => db.disconnect())
            .catch((err) => {
                logger.log('error', err);

                db.disconnect();
            });
    });

caporal.parse(process.argv);
