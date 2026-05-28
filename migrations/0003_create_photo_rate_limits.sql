-- Create photo_rate_limits table for exponential backoff rate limiting
CREATE TABLE photo_rate_limits (
  ip INET PRIMARY KEY,
  attempts INTEGER DEFAULT 0,
  last_attempt TIMESTAMP DEFAULT NOW(),
  blocked_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for cleanup queries (remove old entries)
CREATE INDEX idx_photo_rate_limits_cleanup ON photo_rate_limits(last_attempt);

-- Index for checking blocked status
CREATE INDEX idx_photo_rate_limits_blocked ON photo_rate_limits(blocked_until)
WHERE blocked_until IS NOT NULL;