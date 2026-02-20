import axios from "axios";

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  context?: string;
}

export interface TranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
  confidence?: number;
}

/**
 * Servicio para traducir contenido generado por IA
 */
export class AITranslationService {
  private static cache = new Map<string, string>();

  /**
   * Traduce texto usando el backend
   */
  static async translate({
    text,
    targetLanguage,
    sourceLanguage,
    context,
  }: TranslationRequest): Promise<TranslationResponse> {
    const cacheKey = `${text}-${targetLanguage}`;

    // Verificar caché
    if (this.cache.has(cacheKey)) {
      return {
        translatedText: this.cache.get(cacheKey)!,
      };
    }

    try {
      const response = await axios.post<TranslationResponse>(
        "/api/ai/translate",
        {
          text,
          target_language: targetLanguage,
          source_language: sourceLanguage,
          context,
        }
      );

      // Guardar en caché
      this.cache.set(cacheKey, response.data.translatedText);

      return response.data;
    } catch (error) {
      // Fallback: devolver el texto original
      return {
        translatedText: text,
      };
    }
  }

  /**
   * Traduce múltiples textos en batch
   */
  static async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string[]> {
    try {
      const response = await axios.post<{ translations: string[] }>(
        "/api/ai/translate-batch",
        {
          texts,
          target_language: targetLanguage,
          source_language: sourceLanguage,
        }
      );

      return response.data.translations;
    } catch (error) {
      return texts; // Fallback
    }
  }

  /**
   * Detecta el idioma de un texto
   */
  static async detectLanguage(text: string): Promise<string> {
    try {
      const response = await axios.post<{ language: string }>(
        "/api/ai/detect-language",
        { text }
      );

      return response.data.language;
    } catch (error) {
      return "unknown";
    }
  }

  /**
   * Limpia la caché de traducciones
   */
  static clearCache(): void {
    this.cache.clear();
  }
}
