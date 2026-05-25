/**
 * FASE 6: Frontend - TypeScript Types y Constants
 * 
 * Generados automáticamente desde la configuración PHP.
 * Estos types se sincronizan con config/platform-*.php
 */

// ============================================
// TIPOS PRINCIPALES
// ============================================

export interface Platform {
  id: number;
  key: string;
  name: string;
  active: boolean;
  provider: string;
  color: string;
  priority: number;
}

export interface ContentType {
  label: string;
  description: string;
  platforms: string[];
  media_required: boolean;
  media_min: number;
  media_max: number;
  media_types: string[];
}

export interface MediaSpecs {
  video?: VideoSpecs;
  image?: ImageSpecs;
}

export interface VideoSpecs {
  formats: string[];
  max_size_mb: number;
  max_duration_seconds: number;
  min_duration_seconds: number;
  aspect_ratios?: string[];
  recommended_resolution?: string;
  resolutions?: ResolutionLimits;
}

export interface ImageSpecs {
  formats: string[];
  max_size_mb: number;
  min_width?: number;
  aspect_ratios?: string[];
  recommended_resolution?: string;
}

export interface ResolutionLimits {
  min_width: number;
  max_width: number;
  min_height: number;
  max_height: number;
}

export interface PublishingRules {
  text?: TextRules;
  media?: MediaRules;
  restrictions?: Restrictions;
}

export interface TextRules {
  max_length: number;
  min_length: number;
  hashtags_allowed: boolean;
  mentions_allowed: boolean;
  urls_allowed: boolean;
  max_hashtags?: number;
}

export interface MediaRules {
  multiple_videos_allowed: boolean;
  multiple_images_allowed: boolean;
  mixed_media_allowed: boolean;
  max_images_per_post?: number;
  max_videos_per_post?: number;
  video_and_images_forbidden?: boolean;
}

export interface Restrictions {
  requires_verification: boolean;
  min_account_age_days: number;
  cooldown_seconds: number;
}

export interface Capabilities {
  can_publish: boolean;
  can_schedule?: boolean;
  max_accounts?: number | string;
  max_posts_per_day?: number | string;
  max_post_size_mb?: number;
  max_video_duration_seconds?: number;
  analytics_available?: boolean;
  ai_assistance?: boolean;
  [key: string]: any;
}

export interface APILimits {
  rate_limits?: Record<string, number>;
  quotas?: Record<string, any>;
  by_account_type?: Record<string, any>;
  throttling?: ThrottlingConfig;
}

export interface ThrottlingConfig {
  enabled: boolean;
  retry_after_seconds: number;
  max_retries: number;
}

export interface FeatureFlags {
  enabled?: boolean;
  [key: string]: any;
}

// ============================================
// TIPOS DE VALIDACIÓN
// ============================================

export type ValidationCompatibility = 'compatible' | 'incompatible' | 'warning';

export interface ValidationResult {
  [platform: string]: PlatformValidation;
}

export interface PlatformValidation {
  compatible: boolean;
  errors?: string[];
  warnings?: string[];
  reason?: ValidationReason;
  capabilities?: Capabilities;
}

export type ValidationReason =
  | 'PLATFORM_INACTIVE'
  | 'USER_PLAN_NOT_SUPPORTED'
  | 'CONTENT_TYPE_NOT_SUPPORTED'
  | 'MEDIA_VALIDATION_FAILED'
  | 'PUBLISHING_RULES_VIOLATION';

export interface ValidationSummary {
  can_publish_to_any: boolean;
  compatible_count: number;
  incompatible_count: number;
  compatible_platforms: string[];
  incompatible_platforms: IncompatiblePlatform[];
  warnings: Record<string, string[]>;
}

export interface IncompatiblePlatform {
  platform: string;
  reason: ValidationReason;
  errors: string[];
}

// ============================================
// TIPOS DE RESPUESTA DE API
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

export interface PlatformsResponse extends ApiResponse<any> {
  platforms: Record<string, Platform>;
  total: number;
  active_count: number;
}

export interface ContentTypesResponse extends ApiResponse<any> {
  content_types: Record<string, ContentType>;
  count: number;
}

export interface AvailablePlatformsResponse extends ApiResponse<any> {
  content_type: string;
  user_plan: string;
  available_platforms: AvailablePlatform[];
  count: number;
}

export interface AvailablePlatform {
  key: string;
  platform: Platform;
  capabilities: Capabilities;
}

export interface ValidateContentResponse extends ApiResponse<any> {
  publication_id: number;
  can_publish_to_any: boolean;
  compatible_count: number;
  incompatible_count: number;
  compatible_platforms: string[];
  incompatible_platforms: IncompatiblePlatform[];
  warnings: Record<string, string[]>;
  details: ValidationResult;
}

// ============================================
// CONSTANTES
// ============================================

export const PLATFORM_KEYS = [
  'facebook',
  'instagram',
  'youtube',
  'twitter',
  'tiktok',
  'linkedin',
  'threads',
] as const;

export const CONTENT_TYPE_KEYS = [
  'post',
  'reel',
  'story',
  'carousel',
  'poll',
  'community',
  'thread',
] as const;

export const PLANS = ['free', 'pro', 'business', 'admin'] as const;

export const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-pink-600',
  youtube: 'bg-red-600',
  twitter: 'bg-gray-900',
  tiktok: 'bg-black',
  linkedin: 'bg-blue-700',
  threads: 'bg-gray-900',
};

export const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  twitter: 'X (Twitter)',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  threads: 'Threads',
};

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  reel: 'Reel / Short',
  story: 'Story',
  carousel: 'Carrusel',
  poll: 'Encuesta',
  community: 'Comunidad',
  thread: 'Hilo',
};
