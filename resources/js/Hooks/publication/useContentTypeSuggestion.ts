import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface ContentTypeSuggestionRequest {
  media?: any[];
  current_type?: string;
}

interface ContentTypeSuggestionResponse {
  suggested_type: string;
  current_type?: string;
  should_change: boolean;
}

export const useContentTypeSuggestion = () => {
  return useMutation<ContentTypeSuggestionResponse, Error, ContentTypeSuggestionRequest>({
    mutationFn: async (data) => {
      const response = await axios.post('/api/v1/publications/suggest-content-type', data);
      // Handle both response.data.data and response.data structures
      const result = response.data.data || response.data;
      return result;
    },
  });
};