export interface PlatformConfiguration {
  account_id: number;
  platform: string;
  type: string;
  is_compatible: boolean;
  custom_settings: Record<string, any>;
  errors?: string[];
  warnings?: string[];
}

export interface PreviewData {
  publication_id: number;
  platform_configurations: PlatformConfiguration[];
  validation_results?: any;
}

export interface PublishResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface ApiError {
  message: string;
  response?: {
    data?: {
      message?: string;
    };
  };
}
