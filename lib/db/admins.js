const sqlAdmin = `
    INSERT INTO admin 
    VALUES(
        $1, $2, $3
    ) 
    ON CONFLICT (id) DO 
    UPDATE SET 
        name=$2, email=$3 
    WHERE admin.id=$1
`;

const sqlTeam = `
    INSERT INTO team 
    VALUES(
        $1, $2
    ) 
    ON CONFLICT (id) DO 
    UPDATE SET 
        name=$2 
    WHERE team.id=$1
`;

const sqlAdminTeam = `
    INSERT INTO admin_team 
    VALUES(
        $1, $2
    ) 
    ON CONFLICT DO NOTHING
`;

module.exports = {
    save: (query, admins) => {
        const users = admins.filter(admin => admin.type === 'admin');
        const teams = admins.filter(admin => admin.type === 'team');

        const usersPromises = users.map(admin => query(sqlAdmin, [admin.id, admin.name, admin.email]));
        const teamsPromises = teams.map(team => query(sqlTeam, [team.id, team.name]));

        return Promise.all(usersPromises.concat(teamsPromises))
            .then(() => teams.reduce((prev, team) => ([
                ...prev,
                ...team.admin_ids.map(async (admin) => {
                    try {
                        return await query(sqlAdminTeam, [admin, team.id])
                    } catch (err) {
                        return await new Promise(resolve => resolve());
                    }
                })
            ]), []));
    },
};
