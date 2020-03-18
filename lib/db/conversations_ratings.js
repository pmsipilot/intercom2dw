const sql = `
    UPDATE conversation SET 
        rate_customer_lead=$2, rate_customer_user=$3, rate_teammate_admin=$4,
        rating=$5, rating_remark=$6
    WHERE conversation.id=$1
`;

function resolveUser(query, userId, userType) {
    switch (userType) {
        case 'admin':
            return query('SELECT id FROM admin WHERE id=$1', [userId]);

        case 'user':
            return query('SELECT id FROM "user" WHERE id=$1', [userId]);

        case 'lead':
            return query('SELECT id FROM lead WHERE id=$1', [userId]);

        default:
            throw new Error(`Unsupported author type "${userType}"`);
    }
}

module.exports = {
    save: async (query, conversation, rating) => {
        let ratingCustomer = await resolveUser(query, rating.customer.id, rating.customer.type);
        let ratingTeammate = await resolveUser(query, rating.teammate.id, rating.teammate.type);

        ratingCustomer = ratingCustomer && ratingCustomer.rows.length > 0 ? rating.customer.id : null;
        ratingTeammate = ratingTeammate && ratingTeammate.rows.length > 0 ? rating.teammate.id : null;

        await query(sql, [
            conversation.id,
            rating.customer.type === 'lead' ? ratingCustomer : null,
            rating.customer.type === 'user' ? ratingCustomer : null,
            rating.teammate.type === 'admin' ? ratingTeammate : null,
            rating.rating,
            rating.remark,
        ]);
    },
};
