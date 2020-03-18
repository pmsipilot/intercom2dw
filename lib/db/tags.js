const sql = `
    INSERT INTO tag 
    VALUES(
        $1, $2
    ) 
    ON CONFLICT (id) DO 
    UPDATE SET 
        name=$2 
    WHERE tag.id=$1
`;

module.exports = {
    save: async (query, tags) => {
        for (const tag of tags) {
            await query(sql, [tag.id, tag.name]);
        }
    },
};
