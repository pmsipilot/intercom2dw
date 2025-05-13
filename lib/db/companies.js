const sql = `
    INSERT INTO company
    VALUES(
        $1, $2, $3, $4, $5, COALESCE($6, $1), $7, $8, $9, $10
    )
    ON CONFLICT (id) DO
    UPDATE SET
        created_at=$2, remote_created_at=$3, updated_at=$4,
        company_id=$5, name=COALESCE($6, $1), session_count=$7, monthly_spend=$8,
        user_count=$9, plan=$10
    WHERE company.id=$1
`;

const sqlTags = 'INSERT INTO company_tag_assoc VALUES($1, $2) ON CONFLICT DO NOTHING';
const sqlSegments = 'INSERT INTO company_segment VALUES($1, $2) ON CONFLICT DO NOTHING';
const sqlAttributes = `
    INSERT INTO company_custom_attribute
    VALUES(
        $1, $2, $3
    )
    ON CONFLICT (company_id, name) DO
    UPDATE SET
        value=$3
    WHERE company_custom_attribute.company_id=$1
    AND company_custom_attribute.name=$2
`;

module.exports = {
    save: async (query, companies) => {
        for (const company of companies) {
            await query(sql, [
                company.id,
                company.created_at,
                company.remote_created_at || company.created_at,
                company.updated_at,
                company.company_id,
                company.name,
                company.session_count,
                company.monthly_spend,
                company.user_count,
                company.plan,
            ]);

            for (const companyTag of company.tags.tags) {
                await query(sqlTags, [company.id, companyTag.id]);
            }

            for (const companySegment of company.segments.segments) {
                await query(sqlSegments, [company.id, companySegment.id]);
            }

            for (const attribute of Object.keys(company.custom_attributes)) {
                await query(sqlAttributes, [
                    company.id,
                    attribute,
                    company.custom_attributes[attribute],
                ]);
            }
        }
    },
};
