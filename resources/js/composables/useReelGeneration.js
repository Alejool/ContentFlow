import { ref, computed } from 'vue';
import { useDebounce, useThrottle } from './useDebounce';
import axios from 'axios';

/**
 * Composable for reel generation with debouncing and rate limiting
 * Prevents duplicate requests and provides user feedback
 */
export function useReelGeneration() {
  const isGenerating = ref(false);
  const error = ref(null);
  const progress = ref(0);
  const lastRequestSignature = ref(null);

  // Throttle to max 1 request per 10 seconds
  const { throttledFn: throttledGenerate, isThrottled } = useThrottle(
    async (params) => {
      return await generateReelsInternal(params);
    },
    10000 // 10 seconds
  );

  // Debounce to prevent accidental double-clicks
  const { debouncedFn: debouncedGenerate, isDebouncing } = useDebounce(
    throttledGenerate,
    500 // 500ms
  );

  /**
   * Generate request signature for deduplication
   */
  const getRequestSignature = (params) => {
    const { media_file_id, publication_id, platforms, add_subtitles, language, generate_clips } = params;
    
    return JSON.stringify({
      media_file_id,
      publication_id: publication_id || 'none',
      platforms: (platforms || ['instagram']).sort(),
      add_subtitles: add_subtitles ?? true,
      language: language || 'es',
      generate_clips: generate_clips ?? false,
    });
  };

  /**
   * Check if request is duplicate
   */
  const isDuplicateRequest = (params) => {
    const signature = getRequestSignature(params);
    
    if (lastRequestSignature.value === signature) {
      return true;
    }
    
    return false;
  };

  /**
   * Internal generation function
   */
  const generateReelsInternal = async (params) => {
    // Check for duplicate
    if (isDuplicateRequest(params)) {
      throw new Error('Esta solicitud ya fue enviada. Por favor espera a que termine.');
    }

    isGenerating.value = true;
    error.value = null;
    progress.value = 0;

    try {
      // Store request signature
      lastRequestSignature.value = getRequestSignature(params);

      const response = await axios.post('/api/reels/generate', params);

      // Simulate progress (actual progress would come from websockets/polling)
      simulateProgress();

      return response.data;

    } catch (err) {
      error.value = err.response?.data?.error || err.message || 'Error al generar reels';
      
      // Handle rate limiting
      if (err.response?.status === 429) {
        const retryAfter = err.response.data?.retry_after_human || 'unos minutos';
        error.value = `Demasiadas solicitudes. Intenta de nuevo en ${retryAfter}.`;
      }
      
      // Handle duplicate job
      if (err.response?.status === 409) {
        error.value = err.response.data?.error || 'Ya hay una generación en proceso.';
      }

      throw err;

    } finally {
      isGenerating.value = false;
    }
  };

  /**
   * Simulate progress for better UX
   */
  const simulateProgress = () => {
    const interval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 10;
      } else {
        clearInterval(interval);
      }
    }, 1000);
  };

  /**
   * Public generate function with all protections
   */
  const generate = async (params) => {
    try {
      return await debouncedGenerate(params);
    } catch (err) {
      // Handle debounce/throttle errors gracefully
      if (err.message.includes('debounced') || err.message.includes('wait')) {
        error.value = 'Por favor espera antes de enviar otra solicitud.';
      }
      throw err;
    }
  };

  /**
   * Reset state
   */
  const reset = () => {
    isGenerating.value = false;
    error.value = null;
    progress.value = 0;
    lastRequestSignature.value = null;
  };

  /**
   * Check if can generate (not blocked by any protection)
   */
  const canGenerate = computed(() => {
    return !isGenerating.value && !isDebouncing.value && !isThrottled.value;
  });

  return {
    generate,
    isGenerating,
    isDebouncing,
    isThrottled,
    canGenerate,
    error,
    progress,
    reset,
  };
}
