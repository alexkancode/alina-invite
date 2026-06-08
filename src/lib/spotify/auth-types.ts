export interface TokenState {
  accessToken: string | null;
  expiresAt: number | null;
  isValid(): boolean;
  needsRefresh(): boolean;
}

export interface AuthenticationResult {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
  retryable?: boolean;
}

export interface AuthenticationAttempt {
  attemptNumber: number;
  timestamp: number;
  success: boolean;
  error?: string;
  responseStatus?: number;
}

export interface AuthenticationMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  lastAttempt: AuthenticationAttempt | null;
  averageResponseTime: number;
}

export class SpotifyAuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'SpotifyAuthenticationError';
  }
}