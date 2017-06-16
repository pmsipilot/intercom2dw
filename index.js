const util = require('util');
const fetch = require('node-fetch');

const users = require('./lib/api/users');
const companies = require('./lib/api/companies');
const leads = require('./lib/api/leads');
const admins = require('./lib/api/admins');
const tags = require('./lib/api/tags');
const segments = require('./lib/api/segments');
const events = require('./lib/api/events');
const conversations = require('./lib/api/conversations');

const appId = 'zooz4av1';
const appToken = '8514bf47c9d9cf8f4357b616dad1a18ba4c1ba34';
const auth = new Buffer(`${appId}:${appToken}`);

const pg = require('pg');
const Client = pg.Client;
const client = new Client('postgres://intercom2db:intercom2db@db:5432/intercom2db');
const connect = util.promisify(client.connect.bind(client));
const end = util.promisify(client.end.bind(client));
const query = util.promisify(client.query).bind(client);

connect()
    /*.then(() => tags.fetch())
    .then((tags) => {
        console.log('Tags: ', tags.length);

        return Promise.all(tags.map(tag => query('INSERT INTO tag VALUES($1, $2) ON CONFLICT (id) DO UPDATE SET name=$2 WHERE tag.id=$1', [tag.id, tag.name])));
    })
    .then(() => segments.fetch())
    .then(async (segments) => {
        console.log('Segments: ', segments.length);

        return Promise.all(segments.map(segment => query('INSERT INTO segment VALUES($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name=$2, created_at=$3, updated_at=$4 WHERE segment.id=$1', [segment.id, segment.name, segment.created_at, segment.updated_at])));
    })
    .then(() => companies.fetch())
    .then((companies) => {
        console.log('Companies: ', companies.length);

        return Promise.all(companies.map(async (company) => {
            await query('INSERT INTO company VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO UPDATE SET created_at=$2, remote_created_at=$3, updated_at=$4, company_id=$5, name=$6, session_count=$7, monthly_spend=$8, user_count=$9, plan=$10 WHERE company.id=$1', [company.id, company.created_at, company.remote_created_at, company.updated_at, company.company_id, company.name, company.session_count, company.monthly_spend, company.user_count, company.plan])

            return Promise.all(Object.keys(company.custom_attributes).map(attribute => query('INSERT INTO company_custom_attribute VALUES($1, $2, $3) ON CONFLICT (company_id, name) DO UPDATE SET value=$3 WHERE company_custom_attribute.company_id=$1 AND company_custom_attribute.name=$2', [company.id, attribute, company.custom_attributes[attribute]])));
        }));
    })
    .then(() => leads.fetch())
    .then((leads) => {
        console.log('Leads: ', leads.length);

        return Promise.all(leads.map(async (lead) => {
            const sql = `
                INSERT INTO lead 
                VALUES(
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
                ) 
                ON CONFLICT (id) DO 
                UPDATE SET 
                    created_at=$2, updated_at=$3, user_id=$4, email=$5, 
                    phone=$6, name=$7, last_request_at=$8, avatar=$9, 
                    unsubscribed_from_emails=$10, user_agent_data=$11, last_seen_ip=$12, social_profiles=$13, 
                    city_name=$14, continent_code=$15, country_code=$16, country_name=$17, 
                    latitude=$18, longitude=$19, postal_code=$20, region_name=$21, 
                    timezone=$22
                WHERE lead.id=$1
            `;

            await query(sql, [
                lead.id,
                lead.created_at, lead.updated_at, lead.user_id, lead.email,
                lead.phone, lead.name, lead.last_request_at, lead.avatar.image_url,
                lead.unsubscribed_from_emails, lead.user_agent_data, lead.last_seen_ip, lead.social_profiles,
                lead.location_data.city_name, lead.location_data.continent_code, lead.location_data.country_code, lead.location_data.country_name,
                lead.location_data.latitude, lead.location_data.longitude, lead.location_data.postal_code, lead.location_data.region_name,
                lead.location_data.timezone
            ]);

            const companies = lead.companies.companies.map(company => query('INSERT INTO lead_company VALUES($1, $2) ON CONFLICT DO NOTHING', [lead.id, company.id]));
            const tags  = lead.tags.tags.map(tag => query('INSERT INTO lead_tag_assoc VALUES($1, $2) ON CONFLICT DO NOTHING', [lead.id, tag.id]));
            const segments  = lead.segments.segments.map(segment => query('INSERT INTO lead_segment VALUES($1, $2) ON CONFLICT DO NOTHING', [lead.id, segment.id]));
            const attributes  = Object.keys(lead.custom_attributes).map(attribute => query('INSERT INTO lead_custom_attribute VALUES($1, $2, $3) ON CONFLICT (lead_id, name) DO UPDATE SET value=$3 WHERE lead_custom_attribute.lead_id=$1 AND lead_custom_attribute.name=$2', [lead.id, attribute, lead.custom_attributes[attribute]]));

            return Promise.all(companies.concat(tags).concat(segments).concat(attributes));
        }));
    })
    .then(() => query('REFRESH MATERIALIZED VIEW CONCURRENTLY lead_tag'))
    .then(() => users.fetch())
    .then((users) => {
        console.log('Users: ', users.length);

        return Promise.all(users.map(async (user) => {
            const sql = `
                INSERT INTO "user" 
                VALUES(
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 
                    $23, $24, $25, $26, $27
                ) 
                ON CONFLICT (id) DO 
                UPDATE SET 
                    user_id=$2, email=$3, phone=$4, name=$5, 
                    updated_at=$6, last_seen_ip=$7, enabled=$8, last_request_at=$9, 
                    unsubscribed_from_emails=$10, signed_up_at=$11, created_at=$12, session_count=$13, 
                    user_agent_data=$14, pseudonym=$15, anonymous=$16, avatar=$17, 
                    social_profiles=$18, city_name=$19, continent_code=$20, country_code=$21, 
                    country_name=$22, latitude=$23, longitude=$24, postal_code=$25, 
                    region_name=$26, timezone=$27
                WHERE "user".id=$1
            `;

            await query(sql, [
                user.id,
                user.user_id, user.email, user.phone, user.name,
                user.updated_at, user.last_seen_ip, user.enabled, user.last_request_at,
                user.unsubscribed_from_emails, user.signed_up_at, user.created_at, user.session_count,
                user.user_agent_data, user.pseudonym, user.anonymous, user.avatar.image_url,
                user.social_profiles, user.location_data.city_name, user.location_data.continent_code, user.location_data.country_code,
                user.location_data.country_name, user.location_data.latitude, user.location_data.longitude, user.location_data.postal_code,
                user.location_data.region_name, user.location_data.timezone
            ]);

            const companies = user.companies.companies.map(company => query('INSERT INTO user_company VALUES($1, $2) ON CONFLICT DO NOTHING', [user.id, company.id]));
            const tags  = user.tags.tags.map(tag => query('INSERT INTO user_tag_assoc VALUES($1, $2) ON CONFLICT DO NOTHING', [user.id, tag.id]));
            const segments  = user.segments.segments.map(segment => query('INSERT INTO user_segment VALUES($1, $2) ON CONFLICT DO NOTHING', [user.id, segment.id]));
            const attributes  = Object.keys(user.custom_attributes).map(attribute => query('INSERT INTO user_custom_attribute VALUES($1, $2, $3) ON CONFLICT (user_id, name) DO UPDATE SET value=$3 WHERE user_custom_attribute.user_id=$1 AND user_custom_attribute.name=$2', [user.id, attribute, user.custom_attributes[attribute]]));

            return Promise.all(companies.concat(tags).concat(segments).concat(attributes));
        }));
    })
    .then(() => query('REFRESH MATERIALIZED VIEW CONCURRENTLY user_tag'))*/
    .then(() => admins.fetch())
    .then((admins) => {
        console.log('Admins: ', admins.length);

        return Promise.all(admins.map(admin => query('INSERT INTO admin VALUES($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name=$2, email=$3 WHERE admin.id=$1', [admin.id, admin.name, admin.email])));
    })
    .then(() => conversations.fetch())
    .then((conversations) => {
        console.log('Conversations: ', conversations.length);

        return Promise.all(conversations.map(async (conversation) => {
            let authors;
            let author = null;

            switch (conversation.conversation_message.author.type) {
                case 'admin':
                    authors = await query('SELECT id FROM admin WHERE id=$1', [conversation.conversation_message.author.id]);
                    break;

                case 'user':
                    authors = await query('SELECT id FROM "user" WHERE id=$1', [conversation.conversation_message.author.id]);
                    break;
            }

            if (authors && authors.rows.length > 0) {
                author = conversation.conversation_message.author.id;
            }

            try {
                const sql = `
                    INSERT INTO conversation VALUES(
                        $1, 
                        $2, $3, 
                        $4, $5, 
                        $6, 
                        $7, 
                        $8, null, $9, $10, 
                        $11, $12, $13
                    ) 
                    ON CONFLICT (id) DO 
                    UPDATE SET 
                        created_at=$2, updated_at=$3,                        
                        subject=$4, body=$5,
                        author_user=$6, 
                        author_admin=$7,                        
                        "user"=$8, assignee=$9, open=$10, 
                        read=$11, conversation_parts=$12, tags=$13 
                    WHERE conversation.id=$1                
                `;

                await query(sql, [
                    conversation.id,
                    conversation.created_at, conversation.updated_at,
                    conversation.conversation_message.subject, conversation.conversation_message.body,
                    conversation.conversation_message.author.type === 'user' ? author : null,
                    conversation.conversation_message.author.type === 'admin' && author ? parseInt(author || 0, 10) : null,
                    conversation.user.id, conversation.assignee.id ? conversation.assignee.id : null, conversation.open,
                    conversation.read, conversation.conversation_parts, conversation.tags
                ])
            } catch (e) {
                try {
                    const sql = `
                        INSERT INTO conversation VALUES(
                            $1, 
                            $2, $3, 
                            $4, $5, 
                            $6, 
                            $7, 
                            null, $8, $9, $10, 
                            $11, $12, $13
                        ) 
                        ON CONFLICT (id) DO 
                        UPDATE SET 
                            created_at=$2, updated_at=$3,                        
                            subject=$4, body=$5,
                            author_user=$6, 
                            author_admin=$7,
                            "lead"=$8, assignee=$9, open=$10, 
                            read=$11, conversation_parts=$12, tags=$13 
                        WHERE conversation.id=$1                
                    `;

                    await query(sql, [
                        conversation.id, conversation.created_at, conversation.updated_at,
                        conversation.conversation_message.subject, conversation.conversation_message.body,
                        conversation.conversation_message.author.type === 'user' ? author : null,
                        conversation.conversation_message.author.type === 'admin' && author ? parseInt(author || 0, 10) : null,
                        conversation.user.id, conversation.assignee.id ? conversation.assignee.id : null, conversation.open,
                        conversation.read, conversation.conversation_parts, conversation.tags
                    ]);
                } catch (e) {
                    try {
                        const sql = `
                            INSERT INTO conversation VALUES(
                                $1, 
                                $2, $3, 
                                $4, $5, 
                                $6, 
                                $7, 
                                null, null, $8, $9, $10, $11, $12
                            ) 
                            ON CONFLICT (id) DO 
                            UPDATE SET 
                                created_at=$2, updated_at=$3,                        
                                subject=$4, body=$5,
                                author_user=$6, 
                                author_admin=$7,
                                assignee=$8, open=$9, 
                                read=$10, conversation_parts=$11, tags=$12 
                            WHERE conversation.id=$1                
                        `;

                        await query(sql, [
                            conversation.id, conversation.created_at, conversation.updated_at,
                            conversation.conversation_message.subject, conversation.conversation_message.body,
                            conversation.conversation_message.author.type === 'user' ? author : null,
                            conversation.conversation_message.author.type === 'admin' && author ? parseInt(author, 10) : null,
                            conversation.assignee.id ? conversation.assignee.id : null, conversation.open,
                            conversation.read, conversation.conversation_parts, conversation.tags
                        ]);
                    } catch (e) {
                        console.log(conversation);

                        throw e;
                    }
                }
            }
        }));
    })
    /*.then(async () => {
        const users = await query('SELECT id FROM "user"');

        while (users.rows.length > 0) {
            const user = users.rows.shift();

            await events.fetch(user.id).then((events) => {
                return Promise.all(events.map((event) => {
                    return query('INSERT INTO "event" VALUES($1, $2, $3, $4, $5, $6) ON CONFLICT (event_name, created_at) DO UPDATE SET user_id=$3, id=$4, email=$5, metadata=$6 WHERE "event".event_name=$1 AND "event".created_at=$2', [event.event_name, event.created_at, user.id, event.id, event.email, event.metadata])
                }));
            });

            console.log('Users: ', users.rows.length);
        }
    })*/
    .then(() => end())
    .catch((err) => {
        console.log(err);

        end();
    });
