CREATE DATABASE metabase;

CREATE TABLE IF NOT EXISTS tag (
  id INTEGER NOT NULL,
  name TEXT NOT NULL,
  CONSTRAINT pk_tag PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS admin (
  id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NULL,
  CONSTRAINT pk_admin PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS segment (
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CONSTRAINT pk_segment PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS company (
  id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  remote_created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  session_count INTEGER NOT NULL,
  monthly_spend NUMERIC NOT NULL,
  user_count INTEGER NOT NULL,
  plan TEXT NOT NULL,
  CONSTRAINT pk_company PRIMARY KEY (id)
);

CREATE TABLE company_custom_attribute (
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  VALUE TEXT NULL,
  CONSTRAINT pk_company_custom_attribute PRIMARY KEY (company_id, name),
  CONSTRAINT fk_company_custom_attribute_company_id FOREIGN KEY(company_id) REFERENCES company(id) ON DELETE CASCADE
);

CREATE TABLE "user" (
  id TEXT NOT NULL,
  user_id TEXT,
  email TEXT,
  phone TEXT,
  name TEXT,
  updated_at INTEGER NOT NULL,
  last_seen_ip TEXT,
  enabled BOOLEAN DEFAULT true,
  last_request_at INTEGER,
  unsubscribed_from_emails BOOLEAN DEFAULT false NOT NULL,
  signed_up_at INTEGER,
  created_at INTEGER NOT NULL,
  session_count INTEGER NOT NULL,
  user_agent_data TEXT,
  pseudonym TEXT,
  anonymous BOOLEAN DEFAULT false NOT NULL,
  avatar TEXT NULL,
  social_profiles JSONB NOT NULL,
  city_name TEXT,
  continent_code TEXT,
  country_code TEXT,
  country_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  postal_code TEXT,
  region_name TEXT,
  timezone TEXT,
  CONSTRAINT pk_user PRIMARY KEY (id)
);

CREATE TABLE user_custom_attribute (
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  VALUE TEXT NULL,
  CONSTRAINT pk_user_custom_attribute PRIMARY KEY (user_id, name),
  CONSTRAINT fk_user_custom_attribute_user_id FOREIGN KEY(user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE user_tag_assoc (
  user_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  CONSTRAINT pk_user_tag_assoc PRIMARY KEY (user_id, tag_id),
  CONSTRAINT fk_user_tag_assoc_user_id FOREIGN KEY(user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_tag_assoc_tag_id FOREIGN KEY(tag_id) REFERENCES tag(id) ON DELETE CASCADE
);

CREATE MATERIALIZED VIEW user_tag(user_id, name) AS
  SELECT "user".id, tag.name
  FROM "user"
    JOIN user_tag_assoc ON user_tag_assoc.user_id = "user".id
    JOIN tag ON user_tag_assoc.tag_id = tag.id;

CREATE UNIQUE INDEX pk_user_tag ON user_tag(user_id, name);

CREATE TABLE user_company (
  user_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  CONSTRAINT pk_user_company PRIMARY KEY (user_id, company_id),
  CONSTRAINT fk_user_company_user_id FOREIGN KEY(user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_company_company_id FOREIGN KEY(company_id) REFERENCES company(id) ON DELETE CASCADE
);

CREATE TABLE user_segment (
  user_id TEXT NOT NULL,
  segment_id TEXT NOT NULL,
  CONSTRAINT pk_user_segment PRIMARY KEY (user_id, segment_id),
  CONSTRAINT fk_user_segment_user_id FOREIGN KEY(user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_segment_segment_id FOREIGN KEY(segment_id) REFERENCES segment(id) ON DELETE CASCADE
);

CREATE TABLE lead (
  id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT,
  last_request_at INTEGER,
  avatar TEXT NULL,
  unsubscribed_from_emails BOOLEAN DEFAULT false NOT NULL,
  user_agent_data TEXT,
  last_seen_ip TEXT,
  social_profiles JSONB NOT NULL,
  city_name TEXT,
  continent_code TEXT,
  country_code TEXT,
  country_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  postal_code TEXT,
  region_name TEXT,
  timezone TEXT,
  CONSTRAINT pk_lead PRIMARY KEY (id)
);

CREATE TABLE lead_custom_attribute (
  lead_id TEXT NOT NULL,
  name TEXT NOT NULL,
  VALUE TEXT NULL,
  CONSTRAINT pk_lead_custom_attribute PRIMARY KEY (lead_id, name),
  CONSTRAINT fk_lead_custom_attribute_lead_id FOREIGN KEY(lead_id) REFERENCES lead(id) ON DELETE CASCADE
);

CREATE TABLE lead_tag_assoc (
  lead_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  CONSTRAINT pk_lead_tag_assoc PRIMARY KEY (lead_id, tag_id),
  CONSTRAINT fk_lead_tag_assoc_lead_id FOREIGN KEY(lead_id) REFERENCES lead(id) ON DELETE CASCADE,
  CONSTRAINT fk_lead_tag_assoc_tag_id FOREIGN KEY(tag_id) REFERENCES tag(id) ON DELETE CASCADE
);

CREATE MATERIALIZED VIEW lead_tag(lead_id, name) AS
  SELECT lead.id, tag.name
  FROM lead
  JOIN lead_tag_assoc ON lead_tag_assoc.lead_id = lead.id
  JOIN tag ON lead_tag_assoc.tag_id = tag.id;

CREATE UNIQUE INDEX pk_lead_tag ON lead_tag(lead_id, name);

CREATE TABLE lead_company (
  lead_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  CONSTRAINT pk_lead_company PRIMARY KEY (lead_id, company_id),
  CONSTRAINT fk_lead_company_lead_id FOREIGN KEY(lead_id) REFERENCES lead(id) ON DELETE CASCADE,
  CONSTRAINT fk_lead_company_company_id FOREIGN KEY(company_id) REFERENCES company(id) ON DELETE CASCADE
);

CREATE TABLE lead_segment (
  lead_id TEXT NOT NULL,
  segment_id TEXT NOT NULL,
  CONSTRAINT pk_lead_segment PRIMARY KEY (lead_id, segment_id),
  CONSTRAINT fk_lead_segment_lead_id FOREIGN KEY(lead_id) REFERENCES lead(id) ON DELETE CASCADE,
  CONSTRAINT fk_lead_segment_segment_id FOREIGN KEY(segment_id) REFERENCES segment(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversation (
  id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  subject TEXT NULL,
  body TEXT NOT NULL,
  author_user TEXT NULL,
  author_admin INTEGER NULL,
  "user" TEXT NULL,
  "lead" TEXT NULL,
  assignee INTEGER NULL,
  open BOOLEAN NOT NULL DEFAULT TRUE,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  conversation_parts JSONB NULL,
  tags JSONB NULL,
  CONSTRAINT pk_conversation PRIMARY KEY (id),
  CONSTRAINT fk_conversation_assignee_admin_id FOREIGN KEY(assignee) REFERENCES admin(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_author_admin_id FOREIGN KEY(author_admin) REFERENCES admin(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_author_user_id FOREIGN KEY(author_user) REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_user_id FOREIGN KEY("user") REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_lead_id FOREIGN KEY(lead) REFERENCES lead(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "event" (
  event_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  user_id TEXT NULL,
  id TEXT NULL,
  email TEXT NULL,
  metadata JSONB NULL,
  CONSTRAINT pk_event PRIMARY KEY (event_name, created_at),
  CONSTRAINT fk_event_user_id FOREIGN KEY(user_id) REFERENCES "user"(id) ON DELETE CASCADE
);
