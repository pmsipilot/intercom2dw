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
    save: async (query, admins, logger = null) => {
        const users = admins.filter(admin => admin.type === 'admin');
        const teams = admins.filter(admin => admin.type === 'team');

        for (const user of users) {
            await query(sqlAdmin, [user.id, user.name, user.email]);
        }

        for (const team of teams) {
            await query(sqlTeam, [team.id, team.name]);

            for (const teamAdmin of team.admin_ids) {
                try {
                    await query(sqlAdminTeam, [teamAdmin, team.id]);
                } catch (err) {
                    if (logger) {
                        logger.log('error', `Could not add admin ${teamAdmin} to team ${team.name}`);
                    }
                }
            }
        }
    },
};
