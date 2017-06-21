const sql = `
    INSERT INTO admin 
    VALUES(
        $1, $2, $3
    ) 
    ON CONFLICT (id) DO 
    UPDATE SET 
        name=$2, email=$3 
    WHERE admin.id=$1
`;

module.exports = {
    save: (query, admins) => Promise.all(admins.map(admin => query(sql, [admin.id, admin.name, admin.email]))),
};
