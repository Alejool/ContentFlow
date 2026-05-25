/**
 * FASE 6: Frontend - Service API para Configuración
 * 
 * Service reutilizable para consumir los endpoints de API.
 * Incluye caché y error handling.
 */

import axios, { AxiosInstance } from 'axios';
import type {
  ApiResponse,
  Platform,
  ContentType,
  Capabilities,
  ValidationResult,
  AvailablePlatformsResponse,
  ValidateContentResponse,
  PlatformsResponse,
  ContentTypesResponse,
} from '@/types/PlatformConfiguration';

class PlatformConfigurationApiService {
  private api: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiry = 3600000; // 1 hora en ms

  constructor(baseURL = '/api/platform-configuration') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  }

  /**
   * Obtiene plataformas con caché
   */
  async getPlatforms(): Promise<PlatformsResponse> {
    return this.cachedGet('platforms', () =>
      this.api.get<PlatformsResponse>('/platforms')
    );
  }

  /**
   * Obtiene una plataforma específica
   */
  async getPlatform(key: string): Promise<Platform> {
    const cacheKey = `platform:${key}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    const response = await this.api.get(`/platforms/${key}`);
    this.cache.set(cacheKey, {
      data: response.data.platform,
      timestamp: Date.now(),
    });
    
    return response.data.platform;
  }

  /**
   * Obtiene tipos de contenido
   */
  async getContentTypes(platform?: string): Promise<ContentTypesResponse> {
    const cacheKey = `contentTypes:${platform || 'all'}`;
    
    return this.cachedGet(cacheKey, () =>
      this.api.get<ContentTypesResponse>('/content-types', {
        params: { platform },
      })
    );
  }

  /**
   * Obtiene especificaciones de medios
   */
  async getMediaSpecs(platform: string) {
    const cacheKey = `mediaSpecs:${platform}`;
    
    return this.cachedGet(cacheKey, () =>
      this.api.get(`/media-specs/${platform}`)
    );
  }

  /**
   * Obtiene reglas de publicación
   */
  async getPublishingRules(platform: string) {
    const cacheKey = `publishingRules:${platform}`;
    
    return this.cachedGet(cacheKey, () =>
      this.api.get(`/publishing-rules/${platform}`)
    );
  }

  /**
   * Obtiene capacidades de un plan
   */
  async getCapabilities(plan: string, platform?: string) {
    const cacheKey = `capabilities:${plan}:${platform || 'all'}`;
    const endpoint = platform
      ? `/capabilities/${plan}/${platform}`
      : `/capabilities/${plan}`;
    
    return this.cachedGet(cacheKey, () => this.api.get(endpoint));
  }

  /**
   * Obtiene límites de API
   */
  async getAPILimits(platform: string) {
    const cacheKey = `apiLimits:${platform}`;
    
    return this.cachedGet(cacheKey, () =>
      this.api.get(`/api-limits/${platform}`)
    );
  }

  /**
   * Obtiene feature flags
   */
  async getFeatureFlags(platform: string) {
    const cacheKey = `featureFlags:${platform}`;
    
    return this.cachedGet(cacheKey, () =>
      this.api.get(`/feature-flags/${platform}`)
    );
  }

  /**
   * Obtiene plataformas disponibles para un tipo de contenido
   */
  async getAvailablePlatforms(
    contentType: string,
    userPlan: string = 'free'
  ): Promise<AvailablePlatformsResponse> {
    const cacheKey = `availablePlatforms:${contentType}:${userPlan}`;
    
    return this.cachedGet(cacheKey, () =>
      this.api.get<AvailablePlatformsResponse>(
        '/available-platforms-for-content',
        {
          params: {
            content_type: contentType,
            user_plan: userPlan,
          },
        }
      )
    );
  }

  /**
   * Valida contenido contra plataformas
   */
  async validateContent(
    publicationId: number,
    platforms: string[],
    userPlan: string = 'free'
  ): Promise<ValidateContentResponse> {
    // NO cachear validaciones (son específicas por contenido)
    const response = await this.api.post<ValidateContentResponse>(
      '/validate-content',
      {
        publication_id: publicationId,
        platforms,
        user_plan: userPlan,
      }
    );
    
    return response.data;
  }

  /**
   * Obtiene estadísticas
   */
  async getStatistics() {
    const cacheKey = 'statistics';
    
    return this.cachedGet(cacheKey, () => this.api.get('/statistics'));
  }

  /**
   * Helper para caché
   */
  private async cachedGet<T>(key: string, fetcher: () => Promise<any>): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    const response = await fetcher();
    this.cache.set(key, {
      data: response.data,
      timestamp: Date.now(),
    });
    
    return response.data;
  }

  /**
   * Limpia caché
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Limpia caché de una clave específica
   */
  clearCacheKey(key: string) {
    this.cache.delete(key);
  }
}

// Instancia singleton
let instance: PlatformConfigurationApiService;

export function usePlatformConfigurationApi() {
  if (!instance) {
    instance = new PlatformConfigurationApiService();
  }
  return instance;
}

export default PlatformConfigurationApiService;
