CREATE INDEX IF NOT EXISTS event_created_at_index
    ON event (created_at DESC);

CREATE INDEX IF NOT EXISTS  event_event_name_index
    ON event (event_name);
