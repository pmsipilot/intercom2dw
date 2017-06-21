const sql = `
    INSERT INTO "event" 
    VALUES(
        $1, $2, $3, $4, $5, $6
    ) 
    ON CONFLICT (event_name, created_at, user_id) DO 
    UPDATE SET 
        user_id=$3, id=$4, email=$5, metadata=$6 
    WHERE "event".event_name=$1 
    AND "event".created_at=$2
    AND "event".user_id=$3
`;

module.exports = {
    save: (query, user, events) => Promise.all(events.map(event => query(sql, [
        event.event_name,
        event.created_at,
        user.id,
        event.id,
        event.email,
        event.metadata,
    ]))),
};
