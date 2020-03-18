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
    save: async (query, segments) => {
        for (const segment of segments) {
            await query(sql, [
                segment.id,
                segment.name,
                segment.created_at,
                segment.updated_at,
            ]);
        }
    },
};
