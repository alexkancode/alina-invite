import pool from './db';

export interface OverlayImage {
  id: string;
  filename: string;
  display_name: string;
  file_size: number;
  upload_date: Date;
  is_active: boolean;
  opacity: number;
  blend_mode: string;
  created_by: string;
  description?: string;
}

export interface OverlaySettings {
  overlay_probability: number;
  overlay_on_photos: boolean;
  overlay_on_iridescent: boolean;
  overlay_rotation_enabled: boolean;
  overlay_max_per_session: number;
  overlay_cache_duration: number;
}

/**
 * Save overlay image metadata to database
 */
export async function saveOverlayMetadata(overlay: Omit<OverlayImage, 'upload_date'>): Promise<void> {
  try {
    await pool.query(`
      INSERT INTO overlay_images (
        id, filename, display_name, file_size, is_active,
        opacity, blend_mode, created_by, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      overlay.id,
      overlay.filename,
      overlay.display_name,
      overlay.file_size,
      overlay.is_active,
      overlay.opacity,
      overlay.blend_mode,
      overlay.created_by,
      overlay.description
    ]);
  } catch (error) {
    throw new Error(`Failed to save overlay metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all active overlay images for admin management
 */
export async function getOverlayImages(): Promise<OverlayImage[]> {
  try {
    const { rows } = await pool.query(`
      SELECT id, filename, display_name, file_size, upload_date,
             is_active, opacity, blend_mode, created_by, description
      FROM overlay_images
      ORDER BY upload_date DESC
    `);
    return rows;
  } catch (error) {
    console.error('Database error (get overlays):', error.message);
    return [];
  }
}

/**
 * Get random active overlay for disco ball tile
 */
export async function getRandomActiveOverlay(): Promise<OverlayImage | null> {
  try {
    const { rows } = await pool.query(`
      SELECT id, filename, display_name, file_size, upload_date,
             is_active, opacity, blend_mode, created_by, description
      FROM overlay_images
      WHERE is_active = true
      ORDER BY RANDOM()
      LIMIT 1
    `);
    return rows[0] || null;
  } catch (error) {
    console.error('Database error (random overlay):', error.message);
    return null;
  }
}

/**
 * Update overlay settings
 */
export async function updateOverlaySettings(settings: Partial<OverlaySettings>): Promise<void> {
  try {
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(`
        INSERT INTO overlay_settings (setting_key, setting_value)
        VALUES ($1, $2)
        ON CONFLICT (setting_key)
        DO UPDATE SET setting_value = $2, updated_date = NOW()
      `, [key, String(value)]);
    }
  } catch (error) {
    throw new Error(`Failed to update overlay settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get overlay settings
 */
export async function getOverlaySettings(): Promise<OverlaySettings> {
  const defaults: OverlaySettings = {
    overlay_probability: 0.7,
    overlay_on_photos: true,
    overlay_on_iridescent: false,
    overlay_rotation_enabled: true,
    overlay_max_per_session: 50,
    overlay_cache_duration: 3600
  };

  try {
    const { rows } = await pool.query(`
      SELECT setting_key, setting_value
      FROM overlay_settings
    `);

    const settings = { ...defaults };
    for (const row of rows) {
      const { setting_key, setting_value } = row;
      if (setting_key in defaults) {
        if (typeof defaults[setting_key as keyof OverlaySettings] === 'boolean') {
          settings[setting_key as keyof OverlaySettings] = setting_value === 'true' as any;
        } else {
          settings[setting_key as keyof OverlaySettings] = Number(setting_value) as any;
        }
      }
    }

    return settings;
  } catch (error) {
    console.error('Database error (overlay settings):', error.message);
    return defaults;
  }
}

/**
 * Toggle overlay active status
 */
export async function toggleOverlayStatus(overlayId: string): Promise<void> {
  try {
    await pool.query(`
      UPDATE overlay_images
      SET is_active = NOT is_active
      WHERE id = $1
    `, [overlayId]);
  } catch (error) {
    throw new Error(`Failed to toggle overlay status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete overlay image and metadata
 */
export async function deleteOverlay(overlayId: string): Promise<void> {
  try {
    const result = await pool.query(`
      DELETE FROM overlay_images WHERE id = $1
    `, [overlayId]);

    if (result.rowCount === 0) {
      throw new Error(`Overlay with ID ${overlayId} not found`);
    }
  } catch (error) {
    throw new Error(`Failed to delete overlay: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Record overlay usage for analytics
 */
export async function recordOverlayUsage(
  overlayId: string,
  photoId: string | null,
  tilePosition: number,
  sessionId: string
): Promise<void> {
  try {
    await pool.query(`
      INSERT INTO overlay_usage_stats (overlay_id, photo_id, tile_position, session_id)
      VALUES ($1, $2, $3, $4)
    `, [overlayId, photoId, tilePosition, sessionId]);
  } catch (error) {
    console.error('Failed to record overlay usage:', error.message);
    // Don't throw - analytics shouldn't break functionality
  }
}

/**
 * Get overlay usage statistics
 */
export async function getOverlayUsageStats(days: number = 7): Promise<Array<{
  overlay_id: string;
  display_name: string;
  usage_count: number;
  last_used: Date;
}>> {
  try {
    const { rows } = await pool.query(`
      SELECT
        ous.overlay_id,
        oi.display_name,
        COUNT(ous.id) as usage_count,
        MAX(ous.used_date) as last_used
      FROM overlay_usage_stats ous
      JOIN overlay_images oi ON ous.overlay_id = oi.id
      WHERE ous.used_date > NOW() - INTERVAL '${days} days'
      GROUP BY ous.overlay_id, oi.display_name
      ORDER BY usage_count DESC
    `);
    return rows;
  } catch (error) {
    console.error('Database error (overlay stats):', error.message);
    return [];
  }
}