-- Create photo_usage_stats table for tracking photo usage in games
CREATE TABLE photo_usage_stats (
  id SERIAL PRIMARY KEY,
  game_type VARCHAR(50) NOT NULL,
  user_photo_count INTEGER DEFAULT 0,
  original_photo_count INTEGER DEFAULT 0,
  usage_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for analytics queries by game type
CREATE INDEX idx_photo_usage_stats_game_type ON photo_usage_stats(game_type);

-- Index for date-based analytics
CREATE INDEX idx_photo_usage_stats_usage_date ON photo_usage_stats(usage_date);

-- Index for combined game type and date queries
CREATE INDEX idx_photo_usage_stats_game_date ON photo_usage_stats(game_type, usage_date);