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

module.exports = {
    save: (query, conversations) => Promise.all(conversations.map(async (conversation) => {
        let authors;
        let author = null;

        const authorType = conversation.conversation_message.author.type;
        const authorParams = [conversation.conversation_message.author.id];

        switch (authorType) {
            case 'admin':
                authors = await query('SELECT id FROM admin WHERE id=$1', authorParams);
                break;

            case 'user':
                authors = await query('SELECT id FROM "user" WHERE id=$1', authorParams);
                break;

            case 'lead':
                authors = await query('SELECT id FROM lead WHERE id=$1', authorParams);
                break;

            default:
                throw new Error(`Unsupported author type "${authorType}"`);
        }

        if (authors && authors.rows.length > 0) {
            author = conversation.conversation_message.author.id;
        }

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
                conversation.user.id, null, conversation.assignee.id ? conversation.assignee.id : null,
                conversation.open, conversation.read, conversation.tags,
            ]);
        } catch (e) {
            await query(sql, [
                conversation.id, conversation.created_at, conversation.updated_at,
                subject, body,
                authorType === 'user' && author ? author : null,
                authorType === 'lead' ? author : null,
                authorType === 'admin' && author ? parseInt(author, 10) : null,
                null, conversation.user.id, conversation.assignee.id ? conversation.assignee.id : null,
                conversation.open, conversation.read, conversation.tags,
            ]);
        }
    })),
};
