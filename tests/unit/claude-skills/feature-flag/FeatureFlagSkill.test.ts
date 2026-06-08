import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeatureFlagSkill } from '../../../../src/lib/claude-skills/feature-flag/FeatureFlagSkill';
import type { ISkillInteraction, IProductionSafety, IScriptInterface, FlagState, ToggleResult } from '../../../../src/lib/claude-skills/feature-flag/types';

describe('FeatureFlagSkill', () => {
  let skill: FeatureFlagSkill;
  let mockInteraction: ISkillInteraction;
  let mockSafety: IProductionSafety;
  let mockScript: IScriptInterface;

  beforeEach(() => {
    mockInteraction = {
      presentFlagList: vi.fn(),
      requestConfirmation: vi.fn(),
      formatResult: vi.fn()
    };

    mockSafety = {
      requiresConfirmation: vi.fn(),
      validateToggleRequest: vi.fn(),
      logChange: vi.fn()
    };

    mockScript = {
      getCurrentFlags: vi.fn(),
      toggleFlag: vi.fn(),
      validateFlagName: vi.fn()
    };

    skill = new FeatureFlagSkill(mockInteraction, mockSafety, mockScript);
  });

  describe('handleCommand', () => {
    it('should display flag list when called with empty input', async () => {
      const mockFlags: FlagState[] = [
        { name: 'musicSearch', enabled: true }
      ];

      vi.mocked(mockScript.getCurrentFlags).mockResolvedValue(mockFlags);
      vi.mocked(mockInteraction.presentFlagList).mockResolvedValue('Flag list display');

      const result = await skill.handleCommand('');

      expect(mockScript.getCurrentFlags).toHaveBeenCalled();
      expect(mockInteraction.presentFlagList).toHaveBeenCalledWith(mockFlags);
      expect(result).toBe('Flag list display');
    });

    it('should handle flag selection and toggle', async () => {
      const mockFlags: FlagState[] = [
        { name: 'musicSearch', enabled: true }
      ];

      const mockToggleResult: ToggleResult = {
        success: true,
        flagName: 'musicSearch',
        previousState: true,
        newState: false,
        timestamp: '2026-06-08T16:15:23.000Z'
      };

      vi.mocked(mockScript.getCurrentFlags).mockResolvedValue(mockFlags);
      vi.mocked(mockSafety.requiresConfirmation).mockReturnValue(false);
      vi.mocked(mockSafety.validateToggleRequest).mockResolvedValue(true);
      vi.mocked(mockScript.toggleFlag).mockResolvedValue(mockToggleResult);
      vi.mocked(mockInteraction.formatResult).mockReturnValue('Success message');

      const result = await skill.handleCommand('1');

      expect(mockScript.toggleFlag).toHaveBeenCalledWith('musicSearch');
      expect(mockSafety.logChange).toHaveBeenCalledWith(mockToggleResult);
      expect(mockInteraction.formatResult).toHaveBeenCalledWith(mockToggleResult);
      expect(result).toBe('Success message');
    });

    it('should handle production confirmation workflow', async () => {
      const mockFlags: FlagState[] = [
        { name: 'musicSearch', enabled: true }
      ];

      vi.mocked(mockScript.getCurrentFlags).mockResolvedValue(mockFlags);
      vi.mocked(mockSafety.requiresConfirmation).mockReturnValue(true);

      const result = await skill.handleCommand('1');

      expect(result).toContain('⚠️  Production Toggle Confirmation');
      expect(result).toContain('musicSearch');
      expect(result).toContain('Type \'CONFIRM\' to proceed');
    });

    it('should handle confirmation step', async () => {
      const mockFlags: FlagState[] = [
        { name: 'musicSearch', enabled: true }
      ];

      const mockToggleResult: ToggleResult = {
        success: true,
        flagName: 'musicSearch',
        previousState: true,
        newState: false,
        timestamp: '2026-06-08T16:15:23.000Z'
      };

      vi.mocked(mockScript.getCurrentFlags).mockResolvedValue(mockFlags);
      vi.mocked(mockSafety.validateToggleRequest).mockResolvedValue(true);
      vi.mocked(mockScript.toggleFlag).mockResolvedValue(mockToggleResult);
      vi.mocked(mockInteraction.formatResult).mockReturnValue('Success message');

      await skill.handleCommand('1');
      const result = await skill.handleCommand('CONFIRM');

      expect(mockScript.toggleFlag).toHaveBeenCalledWith('musicSearch');
      expect(result).toBe('Success message');
    });

    it('should handle invalid selection', async () => {
      const mockFlags: FlagState[] = [
        { name: 'musicSearch', enabled: true }
      ];

      vi.mocked(mockScript.getCurrentFlags).mockResolvedValue(mockFlags);

      const result = await skill.handleCommand('99');

      expect(result).toContain('Invalid selection');
    });

    it('should handle script errors gracefully', async () => {
      vi.mocked(mockScript.getCurrentFlags).mockRejectedValue(new Error('Script failed'));

      const result = await skill.handleCommand('');

      expect(result).toContain('Error loading feature flags');
      expect(result).toContain('Script failed');
    });

    it('should reject invalid toggle requests', async () => {
      const mockFlags: FlagState[] = [
        { name: 'musicSearch', enabled: true }
      ];

      vi.mocked(mockScript.getCurrentFlags).mockResolvedValue(mockFlags);
      vi.mocked(mockSafety.validateToggleRequest).mockResolvedValue(false);

      await skill.handleCommand('1');
      const result = await skill.handleCommand('CONFIRM');

      expect(result).toContain('Toggle request rejected');
      expect(mockScript.toggleFlag).not.toHaveBeenCalled();
    });
  });
});