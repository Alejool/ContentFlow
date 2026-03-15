import axios from "axios";

export interface PlatformLimits {
  max_video_duration: number;
  max_video_size_mb: number;
  max_images_per_post: number;
}

export interface ValidationResult {
  can_publish: boolean;
  platform: string;
  account_name: string;
  is_verified: boolean;
  errors: string[];
  warnings: string[];
  limits: PlatformLimits;
}

export interface ValidationResponse {
  can_publish: boolean;
  validation_results: Record<number, ValidationResult>;
  recommendations: string[];
  message: string;
}

class SocialMediaLimitsService {
  /**
   * Valida el contenido de una publicación contra las plataformas seleccionadas
   */
  async validatePublication(
    publicationId: number,
    platformIds: number[],
  ): Promise<ValidationResponse> {
    try {
      const response = await axios.post(`/api/v1/publications/${publicationId}/validate`, {
        platforms: platformIds,
      });
      return response.data.data;
    } catch (error: any) {
      // Si el error viene del backend con validación, retornarlo
      if (error.response?.data?.data) {
        return error.response.data.data;
      }
      throw error;
    }
  }

  /**
   * Formatea la duración en segundos a un string legible
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Obtiene el color del badge según el estado de verificación
   */
  getVerificationBadgeColor(isVerified: boolean): string {
    return isVerified
      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
  }

  /**
   * Obtiene el icono según el estado de verificación
   */
  getVerificationIcon(isVerified: boolean): string {
    return isVerified ? "✓" : "○";
  }

  /**
   * Agrupa los errores por categoría
   */
  categorizeErrors(errors: string[]): {
    duration: string[];
    size: string[];
    format: string[];
    other: string[];
  } {
    const categorized = {
      duration: [] as string[],
      size: [] as string[],
      format: [] as string[],
      other: [] as string[],
    };

    errors.forEach((error) => {
      const lowerError = error.toLowerCase();
      if (lowerError.includes("duración") || lowerError.includes("largo")) {
        categorized.duration.push(error);
      } else if (lowerError.includes("tamaño") || lowerError.includes("grande")) {
        categorized.size.push(error);
      } else if (lowerError.includes("formato") || lowerError.includes("imagen")) {
        categorized.format.push(error);
      } else {
        categorized.other.push(error);
      }
    });

    return categorized;
  }

  /**
   * Obtiene el mensaje de ayuda para un error específico
   */
  getHelpMessage(error: string): string | null {
    const lowerError = error.toLowerCase();

    if (lowerError.includes("verifica tu cuenta")) {
      return "Verifica tu cuenta en la plataforma para desbloquear límites más altos de duración y tamaño de video.";
    }

    if (lowerError.includes("no permite combinar")) {
      return "Considera crear publicaciones separadas para videos e imágenes.";
    }

    if (lowerError.includes("demasiadas imágenes")) {
      return "Reduce el número de imágenes o divide el contenido en múltiples publicaciones.";
    }

    if (lowerError.includes("múltiples videos")) {
      return "Esta plataforma solo permite un video por publicación. Considera publicar los videos por separado.";
    }

    return null;
  }

  /**
   * Determina si un error es crítico (bloquea la publicación)
   */
  isCriticalError(error: string): boolean {
    const criticalKeywords = [
      "demasiado largo",
      "demasiado grande",
      "no permite",
      "requiere",
      "excede",
    ];

    const lowerError = error.toLowerCase();
    return criticalKeywords.some((keyword) => lowerError.includes(keyword));
  }

  /**
   * Obtiene sugerencias de optimización basadas en los errores
   */
  getOptimizationSuggestions(validationResults: Record<number, ValidationResult>): string[] {
    const suggestions: string[] = [];
    const allErrors: string[] = [];

    Object.values(validationResults).forEach((result) => {
      allErrors.push(...result.errors);
    });

    // Sugerencia para videos largos
    if (allErrors.some((e) => e.toLowerCase().includes("demasiado largo"))) {
      suggestions.push(
        "💡 Considera recortar el video o publicar solo en plataformas que soporten videos largos (YouTube, Facebook)",
      );
    }

    // Sugerencia para archivos grandes
    if (allErrors.some((e) => e.toLowerCase().includes("demasiado grande"))) {
      suggestions.push("💡 Comprime el video para reducir su tamaño sin perder mucha calidad");
    }

    // Sugerencia para verificación
    const hasUnverifiedLimits = Object.values(validationResults).some(
      (result) => !result.is_verified && result.errors.length > 0,
    );

    if (hasUnverifiedLimits) {
      suggestions.push(
        "⭐ Verifica tus cuentas para desbloquear límites más altos y publicar contenido más largo",
      );
    }

    // Sugerencia para múltiples plataformas
    const incompatibleCount = Object.values(validationResults).filter((r) => !r.can_publish).length;
    const compatibleCount = Object.values(validationResults).filter((r) => r.can_publish).length;

    if (incompatibleCount > 0 && compatibleCount > 0) {
      suggestions.push(
        `✅ Puedes publicar en ${compatibleCount} plataforma(s) compatible(s) y ajustar el contenido para las ${incompatibleCount} restante(s)`,
      );
    }

    return suggestions;
  }

  /**
   * Genera un resumen de la validación
   */
  getValidationSummary(validationResults: Record<number, ValidationResult>): {
    total: number;
    compatible: number;
    incompatible: number;
    withWarnings: number;
  } {
    const results = Object.values(validationResults);

    return {
      total: results.length,
      compatible: results.filter((r) => r.can_publish).length,
      incompatible: results.filter((r) => !r.can_publish).length,
      withWarnings: results.filter((r) => r.warnings.length > 0).length,
    };
  }
}

export default new SocialMediaLimitsService();
