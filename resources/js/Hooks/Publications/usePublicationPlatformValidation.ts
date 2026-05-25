/**
 * INTEGRACIÓN: Hook para validación de plataformas en publicaciones
 */

import { useEffect, useState } from 'react';
import axios from 'axios';
import type { PlatformValidationStatus } from '@/Components/Content/Publication/common/PublicationPlatformSelector';

interface UsePublicationPlatformValidationOptions {
  contentType?: string;
  selectedAccountIds?: number[];
  publicationId?: number;
  autoValidate?: boolean;
}

export function usePublicationPlatformValidation({
  contentType = 'post',
  selectedAccountIds = [],
  publicationId,
  autoValidate = true,
}: UsePublicationPlatformValidationOptions = {}) {
  const [validation, setValidation] = useState<PlatformValidationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = async () => {
    if (!autoValidate || !selectedAccountIds.length) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        content_type: contentType,
        social_account_ids: selectedAccountIds.join(','),
        ...(publicationId && { publication_id: String(publicationId) }),
      });

      const response = await axios.get(`/api/publications/validate-platforms?${params}`);

      if (response.data.success) {
        setValidation(response.data.data);
      } else {
        setError(response.data.message || 'Error al validar plataformas');
      }
    } catch (err) {
      console.error('Platform validation error:', err);
      setError('Error al validar plataformas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(validate, 300); // Debounce
    return () => clearTimeout(timer);
  }, [contentType, selectedAccountIds, publicationId, autoValidate]);

  return {
    validation,
    loading,
    error,
    validate,
    canPublish: validation?.can_publish_to_any ?? false,
    compatiblePlatforms: validation?.compatible_platforms ?? [],
    incompatiblePlatforms: validation?.incompatible_platforms ?? [],
  };
}
