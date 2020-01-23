const sql = `
    UPDATE conversation SET 
        rate_customer_lead=$2, rate_customer_user=$3, rate_teammate_admin=$4,
        rating=$5, rating_remark=$6
    WHERE conversation.id=$1
`;

async function resolveUser(query, userId, userType) {
    let users = null;
    const userParams = [userId];
    switch (userType) {
        case 'admin':
            users = await query('SELECT id FROM admin WHERE id=$1', userParams);
            break;

        case 'user':
            users = await query('SELECT id FROM "user" WHERE id=$1', userParams);
            break;

        case 'lead':
            users = await query('SELECT id FROM lead WHERE id=$1', userParams);
            break;

        default:
            throw new Error(`Unsupported author type "${userType}"`);
    }

    return users;
}

module.exports = {
    save: async (query, conversation, rating) => {
        let ratingCustomer = null;
        let ratingTeammate = null;

        ratingCustomer = await resolveUser(query, rating.customer.id, rating.customer.type);
        ratingTeammate = await resolveUser(query, rating.teammate.id, rating.teammate.type);
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
