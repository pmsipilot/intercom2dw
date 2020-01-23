const striptags = require('striptags');

const sql = `
    INSERT INTO conversation_part VALUES(
        $1, 
        $2, $3, 
        $4, $5, 
        $6, 
        $7,
        $8,
        $9, $10
    ) 
    ON CONFLICT (id) DO 
    UPDATE SET 
        conversation_id=$2,
        part_type=$3, body=$4,                        
        created_at=$5, updated_at=$6,
        notified_at=$7, 
        assigned_to=$8,                        
        author_user=$9, 
        author_admin=$10
    WHERE conversation_part.id=$1                
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

        case 'bot':
            users = { rows: [] };
            break;

        default:
            throw new Error(`Unsupported author type "${userType}"`);
    }

    return users;
}

module.exports = {
    save: (query, conversation, parts) => Promise.all(parts.map(async (part) => {
        let authors;
        let author = null;
        let assignee = null;

        const authorType = part.author.type;
        const authorParams = [part.author.id];

        switch (authorType) {
            case 'admin':
                authors = await query('SELECT id FROM admin WHERE id=$1', authorParams);
                break;

            case 'user':
                authors = await query('SELECT id FROM "user" WHERE id=$1', authorParams);
                break;

            case 'bot':
                authors = { rows: [] };
                break;

            default:
                throw new Error(`Unsupported author type "${authorType}"`);
        }

        if (authors && authors.rows.length > 0) {
            author = part.author.id;
        }

        if (part.assigned_to) {
            assignee = await resolveUser(query, part.assigned_to.id, 'admin');
        }
        assignee = assignee && assignee.rows.length > 0 ? part.assigned_to.id : null;

        const rawBody = part.body;
        const body = striptags(rawBody);

        return query(sql, [
            part.id,
            conversation.id,
            part.part_type, body,
            part.created_at, part.updated_at,
            part.notified_at,
            assignee,
            authorType === 'user' && author ? author : null,
            authorType === 'admin' && author ? parseInt(author, 10) : null,
        ]);
    })),
};
