-- Create overlay management system for disco ball tiles

-- Store overlay images uploaded by admins
CREATE TABLE IF NOT EXISTS overlay_images (
  id VARCHAR(32) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  opacity REAL DEFAULT 0.8 CHECK (opacity BETWEEN 0.1 AND 1.0),
  blend_mode VARCHAR(20) DEFAULT 'overlay' CHECK (blend_mode IN ('overlay', 'multiply', 'screen', 'soft-light', 'hard-light', 'color-burn', 'color-dodge')),
  created_by VARCHAR(50) DEFAULT 'admin',
  description TEXT
);

-- Track overlay usage statistics
CREATE TABLE IF NOT EXISTS overlay_usage_stats (
  id SERIAL PRIMARY KEY,
  overlay_id VARCHAR(32) REFERENCES overlay_images(id) ON DELETE CASCADE,
  used_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  photo_id VARCHAR(32), -- Can be null for iridescent tiles
  tile_position INTEGER, -- Position in disco ball (0-based)
  session_id VARCHAR(64) -- For tracking per-page-load usage
);

-- Settings for overlay behavior
CREATE TABLE IF NOT EXISTS overlay_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default overlay settings
INSERT INTO overlay_settings (setting_key, setting_value, description) VALUES
('overlay_probability', '0.7', 'Probability that a disco tile gets an overlay (0.0 = never, 1.0 = always)'),
('overlay_on_photos', 'true', 'Apply overlays to photo tiles'),
('overlay_on_iridescent', 'false', 'Apply overlays to iridescent tiles'),
('overlay_rotation_enabled', 'true', 'Allow random rotation of overlays (-15° to +15°)'),
('overlay_max_per_session', '50', 'Maximum overlay applications per page load'),
('overlay_cache_duration', '3600', 'Cache duration for processed overlay images (seconds)')
ON CONFLICT (setting_key) DO NOTHING;

-- Indexes for performance
CREATE INDEX idx_overlay_images_active ON overlay_images (is_active, upload_date DESC);
CREATE INDEX idx_overlay_usage_session ON overlay_usage_stats (session_id, used_date);
CREATE INDEX idx_overlay_usage_overlay ON overlay_usage_stats (overlay_id, used_date DESC);