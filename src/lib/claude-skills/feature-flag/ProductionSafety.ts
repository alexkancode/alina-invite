import { promises as fs } from 'fs';
import type { IProductionSafety, ToggleRequest, ToggleResult } from './types.js';

export class ProductionSafety implements IProductionSafety {
  private auditLogPath: string;

  constructor(auditLogPath: string = 'logs/feature-flag-changes.log') {
    this.auditLogPath = auditLogPath;
  }

  requiresConfirmation(environment: string): boolean {
    return environment === 'production';
  }

  async validateToggleRequest(request: ToggleRequest): Promise<boolean> {
    if (!this.isValidFlagName(request.flagName)) {
      return false;
    }

    if (!this.isValidEnvironment(request.environment)) {
      return false;
    }

    if (this.requiresConfirmation(request.environment) && !request.confirmed) {
      return false;
    }

    return true;
  }

  async logChange(result: ToggleResult): Promise<void> {
    try {
      const logEntry = this.formatLogEntry(result);
      await fs.appendFile(this.auditLogPath, logEntry);
    } catch (error) {
      console.warn('Failed to write audit log:', error);
    }
  }

  private isValidFlagName(flagName: string): boolean {
    return !!(flagName && typeof flagName === 'string' && flagName.trim().length > 0);
  }

  private isValidEnvironment(environment: string): boolean {
    const validEnvironments = ['development', 'production', 'test'];
    return validEnvironments.includes(environment);
  }

  private formatLogEntry(result: ToggleResult): string {
    const statusText = result.success ? 'SUCCESS' : 'FAILED';
    const previousText = result.previousState ? 'enabled' : 'disabled';
    const newText = result.newState ? 'enabled' : 'disabled';

    let entry = `${result.timestamp} TOGGLE ${result.flagName}: ${previousText} → ${newText} ${statusText}`;

    if (!result.success && result.error) {
      entry += `: ${result.error}`;
    }

    return entry + '\n';
  }
}