import { describe, it, expect } from 'vitest';
import { validateMigrations } from '../../scripts/migration-validator.ts';

describe('Migration Validation Integration', () => {
  it('should detect the actual web_app role dependency issue from ff48c627', async () => {
    const result = await validateMigrations('./migrations');

    expect(result.valid).toBe(false);
    expect(result.missingRoles).toContain('web_app');
    expect(result.suggestions).toContain('CREATE ROLE web_app;');

    const webAppGrants = result.grantStatements.filter(stmt => stmt.grantee === 'web_app');
    expect(webAppGrants.length).toBeGreaterThan(0);

    const overlayMigration = result.grantStatements.find(
      stmt => stmt.fileName === '0007_create_tile_overlay_system.sql'
    );
    expect(overlayMigration).toBeDefined();
  });

  it('should provide useful output formatting', async () => {
    const result = await validateMigrations('./migrations');
    const output = await import('../../scripts/migration-validator.ts').then(m => m.formatValidationOutput(result));

    expect(output).toContain('❌ Migration validation failed');
    expect(output).toContain('Missing roles: web_app');
    expect(output).toContain('CREATE ROLE web_app;');
    expect(output).toContain('0007_create_tile_overlay_system.sql');
  });
});