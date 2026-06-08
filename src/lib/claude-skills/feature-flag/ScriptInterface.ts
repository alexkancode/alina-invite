import type { IScriptInterface, FlagState, ToggleResult } from './types.js';

export class ScriptInterface implements IScriptInterface {
  private scriptPath: string;
  private execFunction: (command: string) => Promise<{ stdout: string; stderr: string }>;

  constructor(scriptPath: string = 'scripts/feature-flags.js', execFunction?: any) {
    this.scriptPath = scriptPath;
    this.execFunction = execFunction || this.defaultExec;
  }

  private async defaultExec(command: string): Promise<{ stdout: string; stderr: string }> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    return await execAsync(command);
  }

  async getCurrentFlags(): Promise<FlagState[]> {
    try {
      const { stdout } = await this.execFunction(`node ${this.scriptPath} list --json`);
      return JSON.parse(stdout);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse script output');
      }
      throw error;
    }
  }

  async toggleFlag(flagName: string): Promise<ToggleResult> {
    const timestamp = new Date().toISOString();

    try {
      const { stdout } = await this.execFunction(`node ${this.scriptPath} toggle ${flagName}`);

      const result = this.parseToggleOutput(stdout, flagName, timestamp);
      return result;
    } catch (error) {
      return {
        success: false,
        flagName,
        previousState: false,
        newState: false,
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private parseToggleOutput(output: string, flagName: string, timestamp: string): ToggleResult {
    const toggleRegex = /toggled: (\w+) → (\w+)/;
    const match = output.match(toggleRegex);

    if (!match) {
      throw new Error('Unable to parse toggle output');
    }

    const previousState = match[1] === 'enabled';
    const newState = match[2] === 'enabled';

    return {
      success: true,
      flagName,
      previousState,
      newState,
      timestamp
    };
  }

  validateFlagName(flagName: string): boolean {
    if (!flagName || typeof flagName !== 'string') {
      return false;
    }

    const validFlags = ['musicSearch'];
    return validFlags.includes(flagName);
  }
}