export interface FlagState {
  name: string;
  enabled: boolean;
  description?: string;
}

export interface ToggleRequest {
  flagName: string;
  confirmed: boolean;
  environment: 'development' | 'production';
}

export interface ToggleResult {
  success: boolean;
  flagName: string;
  previousState: boolean;
  newState: boolean;
  timestamp: string;
  error?: string;
}

export interface ISkillInteraction {
  presentFlagList(flags: FlagState[]): Promise<string>;
  requestConfirmation(request: ToggleRequest): Promise<boolean>;
  formatResult(result: ToggleResult): string;
}

export interface IProductionSafety {
  requiresConfirmation(environment: string): boolean;
  validateToggleRequest(request: ToggleRequest): Promise<boolean>;
  logChange(result: ToggleResult): Promise<void>;
}

export interface IScriptInterface {
  getCurrentFlags(): Promise<FlagState[]>;
  toggleFlag(flagName: string): Promise<ToggleResult>;
  validateFlagName(flagName: string): boolean;
}

export interface SkillCommandInput {
  input: string;
  selection?: number;
  confirmation?: string;
}