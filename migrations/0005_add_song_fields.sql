ALTER TABLE rsvps ADD COLUMN favorite_song_title TEXT;
ALTER TABLE rsvps ADD COLUMN favorite_song_artist TEXT;
ALTER TABLE rsvps ADD COLUMN favorite_song_year INTEGER;
ALTER TABLE rsvps ADD COLUMN musicbrainz_id TEXT;

-- Add index on musicbrainz_id for potential future lookups
CREATE INDEX IF NOT EXISTS idx_rsvps_musicbrainz_id ON rsvps (musicbrainz_id);