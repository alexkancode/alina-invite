-- Add song metadata columns to RSVP table
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS song_title VARCHAR(255);
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS song_artist VARCHAR(255);
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS song_year INTEGER;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS song_spotify_url TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS song_spotify_id VARCHAR(100);

-- Add index for song searches
CREATE INDEX IF NOT EXISTS idx_rsvps_song_title ON rsvps(song_title);
CREATE INDEX IF NOT EXISTS idx_rsvps_song_artist ON rsvps(song_artist);