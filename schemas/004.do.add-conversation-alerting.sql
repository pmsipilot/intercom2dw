ALTER TABLE conversation ADD COLUMN rate_customer_lead TEXT NULL;
ALTER TABLE conversation ADD COLUMN rate_customer_user TEXT NULL;
ALTER TABLE conversation ADD COLUMN rate_teammate_admin INTEGER NULL;
ALTER TABLE conversation ADD COLUMN rating INTEGER NULL;
ALTER TABLE conversation ADD COLUMN rating_remark TEXT NULL;
ALTER TABLE conversation ADD CONSTRAINT fk_conversation_rate_teammate_admin_id FOREIGN KEY(rate_teammate_admin) REFERENCES admin(id) ON DELETE SET NULL;
ALTER TABLE conversation ADD CONSTRAINT fk_conversation_rate_customer_user_id FOREIGN KEY(rate_customer_user) REFERENCES "user"(id) ON DELETE SET NULL;
ALTER TABLE conversation ADD CONSTRAINT fk_conversation_rate_customer_lead_id FOREIGN KEY(rate_customer_lead) REFERENCES lead(id) ON DELETE SET NULL;

