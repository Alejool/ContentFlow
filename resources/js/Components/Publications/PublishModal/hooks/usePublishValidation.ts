import { Publication } from '@/types/Publication';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface ValidationResult {
  can_publish?: boolean;
  platform_results?: Record<string, any>;
  global_errors?: string[];
  global_warnings?: string[];
  recommendations?: string[];
}

export function usePublishValidation(publication: Publication, selectedPlatforms: number[]) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (selectedPlatforms.length > 0) {
      validateContent();
    } else {
      setValidationResult(null);
      setValidationError(null);
    }
  }, [selectedPlatforms, publication.id, publication.content_type]);

  const validateContent = async () => {
    setIsValidating(true);
    setValidationError(null);

    try {
      const response = await axios.post(`/api/v1/publications/${publication.id}/validate-publish`, {
        platform_ids: selectedPlatforms,
      });
      
      console.log('Validation response:', response.data);
      setValidationResult(response.data);
    } catch (error: any) {
      console.error('Validation error:', error);
      const errorMessage = error.response?.data?.message || 'Error al validar contenido';
      setValidationError(errorMessage);
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const hasBlockingErrors = (): boolean => {
    if (!validationResult) return false;
    return !validationResult.can_publish || 
           (validationResult.global_errors && validationResult.global_errors.length > 0);
  };

  const hasWarnings = (): boolean => {
    if (!validationResult) return false;
    return validationResult.global_warnings && validationResult.global_warnings.length > 0;
  };

  const canPublish = selectedPlatforms.length > 0 && 
                    !isValidating && 
                    !hasBlockingErrors() && 
                    validationResult?.can_publish;

  return {
    validationResult,
    validationError,
    isValidating,
    hasBlockingErrors,
    hasWarnings,
    canPublish: !!canPublish,
    revalidate: validateContent
  };
}