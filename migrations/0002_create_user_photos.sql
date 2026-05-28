-- Create user_photos table for storing photo upload metadata
CREATE TABLE user_photos (
  id VARCHAR(32) PRIMARY KEY,
  upload_date TIMESTAMP DEFAULT NOW(),
  is_approved BOOLEAN DEFAULT FALSE,
  original_filename VARCHAR(255),
  file_size INTEGER,
  upload_ip INET,
  is_hidden BOOLEAN DEFAULT FALSE,
  moderation_notes TEXT
);

-- Index for efficient random selection of approved photos
CREATE INDEX idx_approved_photos ON user_photos(is_approved)
WHERE is_approved = true;

-- Index for pending photos (moderation queue)
CREATE INDEX idx_pending_photos ON user_photos(upload_date)
WHERE is_approved = false AND is_hidden = false;

-- Index for performance on IP-based queries (rate limiting)
CREATE INDEX idx_upload_ip_date ON user_photos(upload_ip, upload_date);