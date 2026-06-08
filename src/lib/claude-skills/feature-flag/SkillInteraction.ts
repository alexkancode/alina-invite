import type { ISkillInteraction, FlagState, ToggleRequest, ToggleResult } from './types.js';

export class SkillInteraction implements ISkillInteraction {
  async presentFlagList(flags: FlagState[]): Promise<string> {
    if (flags.length === 0) {
      return 'No feature flags found.';
    }

    const flagLines = flags.map((flag, index) => {
      const statusIcon = flag.enabled ? '✅' : '❌';
      const statusText = flag.enabled ? 'enabled' : 'disabled';
      let line = `${index + 1}. ${flag.name}: ${statusIcon} ${statusText}`;

      if (flag.description) {
        line += `\n   ${flag.description}`;
      }

      return line;
    });

    const rangeText = flags.length === 1 ? '1-1' : `1-${flags.length}`;

    return `Current Feature Flags:

${flagLines.join('\n')}

Select a flag to toggle (${rangeText}):`;
  }

  async requestConfirmation(request: ToggleRequest): Promise<boolean> {
    if (request.environment === 'development') {
      return true;
    }

    return request.confirmed;
  }

  formatResult(result: ToggleResult): string {
    if (!result.success) {
      return `❌ Failed to toggle ${result.flagName}
Error: ${result.error || 'Unknown error'}`;
    }

    const previousText = result.previousState ? 'enabled' : 'disabled';
    const newText = result.newState ? 'enabled' : 'disabled';

    return `✅ Success! ${result.flagName} toggled
${previousText} → ${newText}

📋 Change logged at ${result.timestamp}
🔄 Rollback available for 5 minutes`;
  }
}