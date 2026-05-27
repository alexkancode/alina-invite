CREATE TABLE IF NOT EXISTS rsvps (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       TEXT    NOT NULL CHECK (length(name) BETWEEN 1 AND 50),
  message    TEXT    NOT NULL DEFAULT '',
  attending  TEXT    NOT NULL CHECK (attending IN ('yes', 'no')),
  ip_hash    TEXT    NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rsvps_ip_hash ON rsvps (ip_hash);
CREATE INDEX IF NOT EXISTS idx_rsvps_name_lower ON rsvps (lower(name));
