import { describe, it, expect, beforeEach } from 'vitest';
import { SkillInteraction } from '../../../../src/lib/claude-skills/feature-flag/SkillInteraction';
import type { FlagState, ToggleRequest, ToggleResult } from '../../../../src/lib/claude-skills/feature-flag/types';

describe('SkillInteraction', () => {
  let skillInteraction: SkillInteraction;

  beforeEach(() => {
    skillInteraction = new SkillInteraction();
  });

  describe('presentFlagList', () => {
    it('should format single flag correctly', async () => {
      const flags: FlagState[] = [
        { name: 'musicSearch', enabled: true }
      ];

      const result = await skillInteraction.presentFlagList(flags);

      expect(result).toContain('Current Feature Flags:');
      expect(result).toContain('1. musicSearch: ✅ enabled');
      expect(result).toContain('Select a flag to toggle (1-1):');
    });

    it('should format multiple flags correctly', async () => {
      const flags: FlagState[] = [
        { name: 'musicSearch', enabled: true },
        { name: 'newFeature', enabled: false }
      ];

      const result = await skillInteraction.presentFlagList(flags);

      expect(result).toContain('1. musicSearch: ✅ enabled');
      expect(result).toContain('2. newFeature: ❌ disabled');
      expect(result).toContain('Select a flag to toggle (1-2):');
    });

    it('should handle empty flags list', async () => {
      const flags: FlagState[] = [];

      const result = await skillInteraction.presentFlagList(flags);

      expect(result).toContain('No feature flags found');
    });

    it('should include flag descriptions when available', async () => {
      const flags: FlagState[] = [
        { name: 'musicSearch', enabled: true, description: 'Enable music search functionality' }
      ];

      const result = await skillInteraction.presentFlagList(flags);

      expect(result).toContain('musicSearch: ✅ enabled');
      expect(result).toContain('Enable music search functionality');
    });
  });

  describe('requestConfirmation', () => {
    it('should generate production confirmation prompt', async () => {
      const request: ToggleRequest = {
        flagName: 'musicSearch',
        confirmed: false,
        environment: 'production'
      };

      const result = await skillInteraction.requestConfirmation(request);

      expect(result).toBe(false);
    });

    it('should automatically confirm for development environment', async () => {
      const request: ToggleRequest = {
        flagName: 'musicSearch',
        confirmed: false,
        environment: 'development'
      };

      const result = await skillInteraction.requestConfirmation(request);

      expect(result).toBe(true);
    });
  });

  describe('formatResult', () => {
    it('should format successful toggle result', () => {
      const result: ToggleResult = {
        success: true,
        flagName: 'musicSearch',
        previousState: true,
        newState: false,
        timestamp: '2026-06-08T16:15:23.000Z'
      };

      const formatted = skillInteraction.formatResult(result);

      expect(formatted).toContain('✅ Success! musicSearch toggled');
      expect(formatted).toContain('enabled → disabled');
      expect(formatted).toContain('Change logged at 2026-06-08T16:15:23.000Z');
    });

    it('should format failed toggle result', () => {
      const result: ToggleResult = {
        success: false,
        flagName: 'musicSearch',
        previousState: true,
        newState: true,
        timestamp: '2026-06-08T16:15:23.000Z',
        error: 'Script execution failed'
      };

      const formatted = skillInteraction.formatResult(result);

      expect(formatted).toContain('❌ Failed to toggle musicSearch');
      expect(formatted).toContain('Error: Script execution failed');
      expect(formatted).not.toContain('Change logged');
    });

    it('should format enabled to disabled transition', () => {
      const result: ToggleResult = {
        success: true,
        flagName: 'musicSearch',
        previousState: true,
        newState: false,
        timestamp: '2026-06-08T16:15:23.000Z'
      };

      const formatted = skillInteraction.formatResult(result);

      expect(formatted).toContain('enabled → disabled');
    });

    it('should format disabled to enabled transition', () => {
      const result: ToggleResult = {
        success: true,
        flagName: 'musicSearch',
        previousState: false,
        newState: true,
        timestamp: '2026-06-08T16:15:23.000Z'
      };

      const formatted = skillInteraction.formatResult(result);

      expect(formatted).toContain('disabled → enabled');
    });
  });
});