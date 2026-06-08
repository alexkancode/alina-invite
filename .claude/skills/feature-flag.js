import { FeatureFlagSkill } from '../../src/lib/claude-skills/feature-flag/FeatureFlagSkill.js';
import { SkillInteraction } from '../../src/lib/claude-skills/feature-flag/SkillInteraction.js';
import { ProductionSafety } from '../../src/lib/claude-skills/feature-flag/ProductionSafety.js';
import { ScriptInterface } from '../../src/lib/claude-skills/feature-flag/ScriptInterface.js';

export const meta = {
  name: 'feature-flag',
  description: 'Interactive feature flag management for production',
  parameters: []
};

export async function handler(params) {
  const scriptInterface = new ScriptInterface();
  const safety = new ProductionSafety();
  const interaction = new SkillInteraction();
  const skill = new FeatureFlagSkill(interaction, safety, scriptInterface);

  return await skill.handleCommand(params?.input || '');
}