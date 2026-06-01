-- Migration: Create Tile Overlay System
-- Description: Add tables for overlay asset management and tile-specific overlay configuration

-- Create overlay assets table
CREATE TABLE overlay_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  content_type VARCHAR(100) NOT NULL,
  security_hash VARCHAR(64) NOT NULL UNIQUE,
  avif_path VARCHAR(500),
  webp_path VARCHAR(500),
  jpeg_path VARCHAR(500) NOT NULL,
  blend_mode VARCHAR(50) DEFAULT 'multiply' CHECK (blend_mode IN ('multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'difference')),
  opacity DECIMAL(3,2) DEFAULT 0.7 CHECK (opacity >= 0 AND opacity <= 1),
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create disco tile overlays table
CREATE TABLE disco_tile_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overlay_asset_id UUID NOT NULL REFERENCES overlay_assets(id) ON DELETE CASCADE,
  tile_position INTEGER NOT NULL CHECK (tile_position >= 0),
  blend_mode VARCHAR(50) DEFAULT 'multiply' CHECK (blend_mode IN ('multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'difference')),
  opacity DECIMAL(3,2) DEFAULT 0.7 CHECK (opacity >= 0 AND opacity <= 1),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tile_position, active) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX idx_overlay_assets_active ON overlay_assets(active) WHERE active = true;
CREATE INDEX idx_overlay_assets_security_hash ON overlay_assets(security_hash);
CREATE INDEX idx_disco_tile_overlays_position ON disco_tile_overlays(tile_position) WHERE active = true;
CREATE INDEX idx_disco_tile_overlays_asset_id ON disco_tile_overlays(overlay_asset_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_overlay_assets_updated_at
  BEFORE UPDATE ON overlay_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample overlay configuration (disabled by default)
INSERT INTO overlay_assets (
  original_name,
  storage_path,
  file_size,
  content_type,
  security_hash,
  jpeg_path,
  active
) VALUES (
  'default-sparkle.jpg',
  '/overlays/default-sparkle.jpg',
  45678,
  'image/jpeg',
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  '/overlays/default-sparkle.jpg',
  false
);

-- Add comments for documentation
COMMENT ON TABLE overlay_assets IS 'Stores uploaded overlay images with optimization variants';
COMMENT ON TABLE disco_tile_overlays IS 'Maps overlay assets to specific disco ball tile positions';
COMMENT ON COLUMN overlay_assets.security_hash IS 'SHA-256 hash of original file for integrity verification';
COMMENT ON COLUMN overlay_assets.blend_mode IS 'CSS blend mode for overlay effect';
COMMENT ON COLUMN disco_tile_overlays.tile_position IS 'Zero-based index of disco ball tile';

-- Grant permissions for application user
GRANT SELECT, INSERT, UPDATE, DELETE ON overlay_assets TO web_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON disco_tile_overlays TO web_app;
GRANT USAGE ON SCHEMA public TO web_app;