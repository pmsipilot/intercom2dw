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

const sqlCompanies = 'INSERT INTO lead_company VALUES($1, $2) ON CONFLICT DO NOTHING';
const sqlTags = 'INSERT INTO lead_tag_assoc VALUES($1, $2) ON CONFLICT DO NOTHING';
const sqlSegments = 'INSERT INTO lead_segment VALUES($1, $2) ON CONFLICT DO NOTHING';
const sqlAttributes = `
    INSERT INTO lead_custom_attribute 
    VALUES(
        $1, $2, $3
    ) 
    ON CONFLICT (lead_id, name) DO 
    UPDATE SET 
        value=$3 
    WHERE lead_custom_attribute.lead_id=$1 
    AND lead_custom_attribute.name=$2
`;

module.exports = {
    save: (query, leads) => Promise.all(leads.map(async (lead) => {
        await query(sql, [
            lead.id,
            lead.created_at, lead.updated_at, lead.user_id, lead.email,
            lead.phone, lead.name, lead.last_request_at, lead.avatar.image_url,
            lead.unsubscribed_from_emails, lead.user_agent_data, lead.last_seen_ip, lead.social_profiles,
            lead.location_data.city_name, lead.location_data.continent_code, lead.location_data.country_code,
            lead.location_data.country_name,
            lead.location_data.latitude, lead.location_data.longitude, lead.location_data.postal_code,
            lead.location_data.region_name, lead.location_data.timezone,
        ]);

        const companies = lead.saveCompanies.saveCompanies.map(company => query(sqlCompanies, [lead.id, company.id]));
        const tags = lead.saveTags.saveTags.map(tag => query(sqlTags, [lead.id, tag.id]));
        const segments = lead.saveSegments.saveSegments.map(segment => query(sqlSegments, [lead.id, segment.id]));
        const attributes = Object.keys(lead.custom_attributes).map(attribute => query(sqlAttributes, [
            lead.id,
            attribute,
            lead.custom_attributes[attribute],
        ]));

        return Promise.all(companies.concat(tags).concat(segments).concat(attributes));
    })),
};
