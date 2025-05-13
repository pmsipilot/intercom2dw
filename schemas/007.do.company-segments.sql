CREATE TABLE IF NOT EXISTS company_segment (
                                            company_id TEXT NOT NULL,
                                            segment_id TEXT NOT NULL,
                                            CONSTRAINT pk_company_segment PRIMARY KEY (company_id, segment_id),
    CONSTRAINT fk_company_segment_company_id FOREIGN KEY(company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_company_segment_segment_id FOREIGN KEY(segment_id) REFERENCES segment(id) ON DELETE CASCADE
    );