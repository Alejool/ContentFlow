export interface PlatformValidationResult {
  is_compatible: boolean;
  errors: string[];
  warnings: string[];
  platform: string;
}

export interface ContentValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  platform_results: Record<string, PlatformValidationResult>;
}

export interface ValidationError {
  message: string;
  response?: {
    data?: {
      message?: string;
    };
  };
}
