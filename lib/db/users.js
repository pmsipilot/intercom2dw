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

const sqlCompanies = 'INSERT INTO user_company VALUES($1, $2) ON CONFLICT DO NOTHING';
const sqlTags = 'INSERT INTO user_tag_assoc VALUES($1, $2) ON CONFLICT DO NOTHING';
const sqlSegments = 'INSERT INTO user_segment VALUES($1, $2) ON CONFLICT DO NOTHING';
const sqlAttributes = `
    INSERT INTO user_custom_attribute 
    VALUES(
        $1, $2, $3
    ) 
    ON CONFLICT (user_id, name) DO 
    UPDATE SET 
        value=$3 
    WHERE user_custom_attribute.user_id=$1 
    AND user_custom_attribute.name=$2
`;

module.exports = {
    save: (query, users) => Promise.all(users.map(async (user) => {
        await query(sql, [
            user.id,
            user.user_id, user.email, user.phone, user.name,
            user.updated_at, user.last_seen_ip, user.enabled, user.last_request_at,
            user.unsubscribed_from_emails, user.signed_up_at, user.created_at, user.session_count,
            user.user_agent_data, user.pseudonym, user.anonymous, user.avatar.image_url,
            user.social_profiles, user.location_data.city_name, user.location_data.continent_code,
            user.location_data.country_code,
            user.location_data.country_name, user.location_data.latitude, user.location_data.longitude,
            user.location_data.postal_code,
            user.location_data.region_name, user.location_data.timezone,
        ]);

        const companies = user.saveCompanies.saveCompanies.map(company => query(sqlCompanies, [user.id, company.id]));
        const tags = user.saveTags.saveTags.map(tag => query(sqlTags, [user.id, tag.id]));
        const segments = user.saveSegments.saveSegments.map(segment => query(sqlSegments, [user.id, segment.id]));
        const attributes = Object.keys(user.custom_attributes).map(attribute => query(sqlAttributes, [
            user.id,
            attribute,
            user.custom_attributes[attribute],
        ]));

        return Promise.all(companies.concat(tags).concat(segments).concat(attributes));
    })),
};
