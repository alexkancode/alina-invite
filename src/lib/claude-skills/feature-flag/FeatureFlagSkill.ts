import type { ISkillInteraction, IProductionSafety, IScriptInterface, FlagState, ToggleRequest } from './types.js';

export class FeatureFlagSkill {
  private pendingToggle: { flagName: string; environment: string } | null = null;

  constructor(
    private interaction: ISkillInteraction,
    private safety: IProductionSafety,
    private scriptInterface: IScriptInterface
  ) {}

  async handleCommand(userInput: string): Promise<string> {
    try {
      const input = userInput.trim();

      if (input === 'CONFIRM' && this.pendingToggle) {
        return await this.handleConfirmation();
      }

      if (input === '' || input === 'list') {
        return await this.handleListCommand();
      }

      const selection = parseInt(input, 10);
      if (isNaN(selection)) {
        return 'Invalid input. Please enter a number to select a flag or type "list" to see all flags.';
      }

      return await this.handleToggleCommand(selection);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    }
  }

  private async handleListCommand(): Promise<string> {
    try {
      const flags = await this.scriptInterface.getCurrentFlags();
      return await this.interaction.presentFlagList(flags);
    } catch (error) {
      return `Error loading feature flags: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async handleToggleCommand(selection: number): Promise<string> {
    try {
      const flags = await this.scriptInterface.getCurrentFlags();

      if (selection < 1 || selection > flags.length) {
        return `Invalid selection. Please choose a number between 1 and ${flags.length}.`;
      }

      const selectedFlag = flags[selection - 1];
      const environment = this.detectEnvironment();

      if (this.safety.requiresConfirmation(environment)) {
        this.pendingToggle = { flagName: selectedFlag.name, environment };
        return this.generateConfirmationPrompt(selectedFlag, environment);
      }

      return await this.executeToggle(selectedFlag.name, environment, true);
    } catch (error) {
      return `Error processing toggle request: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private async handleConfirmation(): Promise<string> {
    if (!this.pendingToggle) {
      return 'No pending toggle request found.';
    }

    const { flagName, environment } = this.pendingToggle;
    this.pendingToggle = null;

    return await this.executeToggle(flagName, environment, true);
  }

  private async executeToggle(flagName: string, environment: string, confirmed: boolean): Promise<string> {
    const request: ToggleRequest = {
      flagName,
      confirmed,
      environment: environment as 'development' | 'production'
    };

    const isValid = await this.safety.validateToggleRequest(request);
    if (!isValid) {
      return 'Toggle request rejected. Please check the flag name and confirmation status.';
    }

    try {
      const result = await this.scriptInterface.toggleFlag(flagName);
      await this.safety.logChange(result);
      return this.interaction.formatResult(result);
    } catch (error) {
      return `Error executing toggle: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private generateConfirmationPrompt(flag: FlagState, environment: string): string {
    const currentState = flag.enabled ? 'enabled' : 'disabled';
    const targetState = flag.enabled ? 'disabled' : 'enabled';

    return `⚠️  Production Toggle Confirmation

Flag: ${flag.name}
Current: ${currentState} → will become: ${targetState}

This affects live users immediately.
Type 'CONFIRM' to proceed:`;
  }

  private detectEnvironment(): string {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }
}