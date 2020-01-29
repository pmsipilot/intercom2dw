const striptags = require('striptags');

const sql = `
    INSERT INTO conversation VALUES(
        $1, 
        $2, $3, 
        $4, $5, 
        $6, 
        $7, 
        $8, $9, $10, 
        $11, $12, $13, $14
    ) 
    ON CONFLICT (id) DO 
    UPDATE SET 
        created_at=$2, updated_at=$3,
        subject=$4, body=$5,
        author_user=$6, 
        author_lead=$7, 
        author_admin=$8,
        "user"=$9, lead=$10, assignee=$11, 
        open=$12, read=$13, tags=$14 
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
    save: (query, conversations) => Promise.all(conversations.map(async (conversation) => {
        let author = null;
        let user = null;
        let assignee = null;

        const authorType = conversation.conversation_message.author.type;

        author = await resolveUser(query, conversation.conversation_message.author.id, authorType);
        author = author && author.rows.length > 0 ? conversation.conversation_message.author.id : null;

        user = await resolveUser(query, conversation.user.id, 'user');
        user = user && user.rows.length > 0 ? conversation.user.id : null;

        if (conversation.assignee.id) {
            assignee = await resolveUser(query, conversation.assignee.id, 'admin');
        }
        assignee = assignee && assignee.rows.length > 0 ? conversation.assignee.id : null;

        const rawBody = conversation.conversation_message.body;
        const body = striptags(rawBody);

        const rawSubject = conversation.conversation_message.subject;
        const subject = striptags(rawSubject);

        try {
            await query(sql, [
                conversation.id, conversation.created_at, conversation.updated_at,
                subject, body,
                authorType === 'user' ? author : null,
                authorType === 'lead' ? author : null,
                authorType === 'admin' && author ? parseInt(author, 10) : null,
                user, null, assignee,
                conversation.open, conversation.read, conversation.tags,
            ]);
        } catch (userConversationError) {
            try {
                await query(sql, [
                    conversation.id, conversation.created_at, conversation.updated_at,
                    subject, body,
                    authorType === 'user' && author ? author : null,
                    authorType === 'lead' ? author : null,
                    authorType === 'admin' && author ? parseInt(author, 10) : null,
                    null, user, assignee,
                    conversation.open, conversation.read, conversation.tags,
                ]);
            } catch (leadConversationError) {
                await new Promise(resolve => resolve());
            }
        }
    })),
};
