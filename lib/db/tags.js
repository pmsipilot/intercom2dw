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
    save: (query, tags) => Promise.all(tags.map(tag => query(sql, [tag.id, tag.name]))),
};
