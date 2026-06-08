import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeatureFlagSkill } from '../../../../src/lib/claude-skills/feature-flag/FeatureFlagSkill';
import { SkillInteraction } from '../../../../src/lib/claude-skills/feature-flag/SkillInteraction';
import { ProductionSafety } from '../../../../src/lib/claude-skills/feature-flag/ProductionSafety';
import { ScriptInterface } from '../../../../src/lib/claude-skills/feature-flag/ScriptInterface';

describe('Feature Flag Skill Integration', () => {
  let skill: FeatureFlagSkill;
  let mockExec: any;

  beforeEach(() => {
    mockExec = vi.fn();
    const scriptInterface = new ScriptInterface('scripts/feature-flags.js', mockExec);
    const safety = new ProductionSafety('test-audit.log');
    const interaction = new SkillInteraction();

    skill = new FeatureFlagSkill(interaction, safety, scriptInterface);
  });

  it('should complete full flag list workflow', async () => {
    const mockFlagsOutput = {
      stdout: JSON.stringify([
        { name: 'musicSearch', enabled: true },
        { name: 'newFeature', enabled: false }
      ]),
      stderr: ''
    };

    mockExec.mockResolvedValue(mockFlagsOutput);

    const result = await skill.handleCommand('');

    expect(result).toContain('Current Feature Flags:');
    expect(result).toContain('1. musicSearch: ✅ enabled');
    expect(result).toContain('2. newFeature: ❌ disabled');
    expect(result).toContain('Select a flag to toggle (1-2):');
  });

  it('should complete full toggle workflow in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const mockFlagsOutput = {
      stdout: JSON.stringify([{ name: 'musicSearch', enabled: true }]),
      stderr: ''
    };

    const mockToggleOutput = {
      stdout: 'Feature flag "musicSearch" toggled: enabled → disabled',
      stderr: ''
    };

    mockExec
      .mockResolvedValueOnce(mockFlagsOutput)
      .mockResolvedValueOnce(mockToggleOutput);

    const result = await skill.handleCommand('1');

    expect(result).toContain('✅ Success! musicSearch toggled');
    expect(result).toContain('enabled → disabled');
    expect(result).toContain('Change logged at');
  });

  it('should handle production confirmation workflow', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const mockFlagsOutput = {
      stdout: JSON.stringify([{ name: 'musicSearch', enabled: true }]),
      stderr: ''
    };

    mockExec.mockResolvedValue(mockFlagsOutput);

    const confirmationResult = await skill.handleCommand('1');
    expect(confirmationResult).toContain('⚠️  Production Toggle Confirmation');
    expect(confirmationResult).toContain('Type \'CONFIRM\' to proceed:');

    const mockToggleOutput = {
      stdout: 'Feature flag "musicSearch" toggled: enabled → disabled',
      stderr: ''
    };

    mockExec.mockResolvedValueOnce(mockToggleOutput);

    const toggleResult = await skill.handleCommand('CONFIRM');
    expect(toggleResult).toContain('✅ Success! musicSearch toggled');
  });

  it('should handle script errors gracefully', async () => {
    mockExec.mockRejectedValue(new Error('Script not found'));

    const result = await skill.handleCommand('');

    expect(result).toContain('Error loading feature flags');
    expect(result).toContain('Script not found');
  });

  it('should handle invalid selections', async () => {
    const mockFlagsOutput = {
      stdout: JSON.stringify([{ name: 'musicSearch', enabled: true }]),
      stderr: ''
    };

    mockExec.mockResolvedValue(mockFlagsOutput);

    const result = await skill.handleCommand('99');

    expect(result).toContain('Invalid selection');
    expect(result).toContain('between 1 and 1');
  });

  it('should validate flag names through script interface', async () => {
    const mockFlagsOutput = {
      stdout: JSON.stringify([{ name: 'musicSearch', enabled: true }]),
      stderr: ''
    };

    const mockToggleError = new Error('Invalid flag name "nonexistentFlag"');

    mockExec
      .mockResolvedValueOnce(mockFlagsOutput)
      .mockRejectedValueOnce(mockToggleError);

    const result = await skill.handleCommand('1');

    expect(result).toContain('Error executing toggle');
  });
});