const sql = `
    INSERT INTO segment 
    VALUES(
        $1, $2, $3, $4
    ) 
    ON CONFLICT (id) DO 
    UPDATE 
    SET 
        name=$2, created_at=$3, updated_at=$4 
    WHERE segment.id=$1
`;

module.exports = {
    save: (query, segments) => Promise.all(segments.map(segment => query(sql, [
        segment.id,
        segment.name,
        segment.created_at,
        segment.updated_at,
    ]))),
};
