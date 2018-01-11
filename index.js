const caporal = require('caporal');
const path = require('path');
const Postgrator = require('postgrator');
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
    .option('--intercom-api-url', 'Intercom API URL', null, process.env.INTERCOM2DW_API_URL || consts.API_URL)
    .option('--db-host', 'Postgres database host', null, process.env.INTERCOM2DW_DB_HOST || consts.DB_HOST)
    .option('--db-port', 'Postgres database port', caporal.INT, process.env.INTERCOM2DW_DB_PORT || consts.DB_PORT)
    .option('--db-user', 'Postgres database username', null, process.env.INTERCOM2DW_DB_USER || consts.DB_USER)
    .option('--db-password', 'Postgres database password', null, process.env.INTERCOM2DW_DB_PASSWORD || consts.DB_PASS)
    .option('--db-name', 'Postgres database name', null, process.env.INTERCOM2DW_DB_NAME || consts.DB_NAME)
    .option('--no-tags', 'Do not load tags (implies --no-users and --no-companies)')
    .option('--no-segments', 'Do not load segments (implies --no-users and --no-companies)')
    .option('--no-admins', 'Do not load admins (implies --no-conversations and --no-conversation-parts)')
    .option('--no-companies', 'Do not load companies (implies --no-users and --no-leads)')
    .option('--no-leads', 'Do not load leads (implies --no-conversations and --no-conversation-parts)')
    .option('--no-users', 'Do not load users (implies --no-conversations, --no-conversation-parts and --no-events)')
    .option('--no-events', 'Do not load events')
    .option('--no-conversations', 'Do not load conversations')
    .option('--no-conversation-parts', 'Do not load conversation parts')
    .option('--company', 'Load only data for the given company', caporal.REPEATABLE)
    .action(async (args, options, logger) => {
        const { dbUser, dbPassword, dbHost, dbPort, dbName } = options;
        const dbDsn = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
        const postgrator = new Postgrator({
            migrationDirectory: path.join(__dirname, 'schemas'),
            driver: 'pg',
            connectionString: dbDsn,
            schemaTable: 'schema_version',
        });

        postgrator.on('validation-started', (migration) => {
            logger.log('info', `Validating migration ${migration.filename}`, migration);
        });
        postgrator.on('migration-finished', (migration) => {
            logger.log('info', `Applied migration ${migration.filename}`, migration);
        });

        try {
            await postgrator.migrate();
        } catch (err) {
            logger.log('error', err.message);

            process.exit(1);
        }

        const api = new Api(options.intercomApiUrl, args.appId, args.appToken, logger);
        const db = new Db(dbDsn, logger);
        let blacklist = 0;

        if (options.noTags) {
            blacklist |= consts.IGNORE_TAGS;

            logger.log('info', 'Tags will be ignored');
        }

        if (options.noSegments) {
            blacklist |= consts.IGNORE_SEGMENTS;

            logger.log('info', 'Segments will be ignored');
        }

        if (options.noAdmins) {
            blacklist |= consts.IGNORE_ADMINS;

            logger.log('info', 'Admins will be ignored');
        }

        if (options.noCompanies) {
            blacklist |= consts.IGNORE_COMPANIES;

            logger.log('info', 'Companies will be ignored');
        }

        if (options.noLeads) {
            blacklist |= consts.IGNORE_LEADS;

            logger.log('info', 'Leads will be ignored');
        }

        if (options.noUsers) {
            blacklist |= consts.IGNORE_USERS;

            logger.log('info', 'Users will be ignored');
        }

        if (options.noEvents) {
            blacklist |= consts.IGNORE_EVENTS;

            logger.log('info', 'Events will be ignored');
        }

        const timer = logger.startTimer();
        const profile = () => {
            timer.done('Time');
            logger.log('info', 'Requests', { requests: api.requests });
        };
        const finish = async () => {
            await db.disconnect();

            profile();
        };

        process.on('SIGINT', () => {
            process.stdout.write('\r');
            logger.log('warn', 'Caught SIGINT');

            finish();

            process.exit();
        });

        process.on('SIGUSR2', profile);

        db.connect()
            .then(() => !(blacklist & consts.TAGS) && api.tags()
                .onBounce(tags => logger.log('info', `Got ${tags.length} tags`))
                .onBounce(tags => db.saveTags(tags))
                .jump()
                .then(() => logger.log('info', 'Done loading tags')),
            )
            .then(() => !(blacklist & consts.SEGMENTS) && api.segments()
                .onBounce(segments => logger.log('info', `Got ${segments.length} segments`))
                .onBounce(segments => db.saveSegments(segments))
                .jump()
                .then(() => logger.log('info', 'Done loading segments')),
            )
            .then(() => !(blacklist & consts.ADMINS) && api.admins()
                .onBounce(admins => logger.log('info', `Got ${admins.length} admins`))
                .onBounce(admins => db.saveAdmins(admins))
                .jump()
                .then(() => logger.log('info', 'Done loading admins')),
            )
            .then(() => !(blacklist & consts.COMPANIES) && api.companies(options.company)
                .onBounce(companies => logger.log('info', `Got ${companies.length} companies`))
                .onBounce(companies => db.saveCompanies(companies))
                .jump()
                .then(() => logger.log('info', 'Done loading companies')),
            )
            .then(() => !(blacklist & consts.LEADS) && api.leads()
                .onBounce(leads => logger.log('info', `Got ${leads.length} leads`))
                .onBounce(leads => db.saveLeads(leads))
                .jump()
                .then(() => db.refreshLeadTags())
                .then(() => logger.log('info', 'Done loading leads')),
            )
            .then(() => !(blacklist & consts.USERS) && api.users(options.company)
                .onBounce(users => logger.log('info', `Got ${users.length} users`))
                .onBounce(users => db.saveUsers(users))
                .jump()
                .then(() => db.refreshUserTags())
                .then(() => logger.log('info', 'Done loading users')),
            )
            .then(() => !(blacklist & consts.EVENTS) && db.fetchOutdatedUsers(options.company)
                .then(async (results) => {
                    let i = 0;

                    for (const user of results.rows) {
                        logger.log('info', `Loading events for user ${i += 1} of ${results.rows.length}`);

                        await api.events(user.id)
                            .onBounce(events => logger.log('info', `Got ${events.length} events`))
                            .onBounce(events => db.saveEvents(user, events))
                            .jump();
                    }
                })
                .then(() => logger.log('info', 'Done loading user events')),
            )
            .then(() => !(blacklist & consts.CONVERSATIONS) && db.fetchCompaniesUsers(options.company)
                .then(users => users.rows.map(user => user.user_id))
                .then(users => api.conversations(users))
                .then(conversations => conversations
                    .onBounce(list => logger.log('info', `Got ${list.length} conversations`))
                    .onBounce(list => db.saveConversations(list))
                    .jump()
                    .then(() => db.refreshConversationResponseTimes())
                    .then(() => logger.log('info', 'Done loading conversations')),
                ),
            )
            .then(() => !(blacklist & consts.PARTS) && db.fetchCompaniesConversations(options.company)
                .then(async (results) => {
                    let i = 0;

                    for (const conversation of results.rows) {
                        logger.log('info', `Loading parts for conversation ${i += 1} of ${results.rows.length}`);

                        await api.parts(conversation.id)
                            .onBounce(parts => logger.log('info', `Got ${parts.length} parts`))
                            .onBounce(parts => db.saveParts(conversation, parts))
                            .jump();
                    }
                })
                .then(() => db.refreshConversationPartResponseTimes())
                .then(() => logger.log('info', 'Done loading conversation parts')),
            )
            .then(finish)
            .catch((err) => {
                logger.log('error', err);

                return finish();
            });
    });

caporal.parse(process.argv);
