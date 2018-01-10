DELETE FROM admin WHERE email IS NULL;

CREATE TABLE IF NOT EXISTS team (
  id INTEGER NOT NULL,
  name TEXT NOT NULL,
  CONSTRAINT pk_team PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS admin_team (
  admin_id INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  CONSTRAINT pk_admin_team PRIMARY KEY (admin_id, team_id),
  CONSTRAINT fk_admin_team_admin_id FOREIGN KEY(admin_id) REFERENCES admin(id) ON DELETE CASCADE,
  CONSTRAINT fk_admin_team_team_id FOREIGN KEY(team_id) REFERENCES team(id) ON DELETE CASCADE
);
