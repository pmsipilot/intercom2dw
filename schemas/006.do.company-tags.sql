CREATE TABLE IF NOT EXISTS company_tag_assoc (
                                              company_id TEXT NOT NULL,
                                              tag_id INTEGER NOT NULL,
                                              CONSTRAINT pk_company_tag_assoc PRIMARY KEY (company_id, tag_id),
    CONSTRAINT fk_company_tag_assoc_company_id FOREIGN KEY(company_id) REFERENCES "company"(id) ON DELETE CASCADE,
    CONSTRAINT fk_company_tag_assoc_tag_id FOREIGN KEY(tag_id) REFERENCES tag(id) ON DELETE CASCADE
    );