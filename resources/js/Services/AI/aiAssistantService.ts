import axios from 'axios';
import route from 'ziggy-js';

export interface SuggestFieldsResponse {
  success: boolean;
  data?: Record<string, unknown>;
  message?: string;
}

export interface ChatProcessResponse {
  success: boolean;
  message: string;
  suggestion?: { data: Record<string, unknown> };
}

export const aiAssistantService = {
  suggestFields: (payload: {
    fields: Record<string, unknown>;
    type: string;
    language: string;
    field_limits?: Record<string, unknown>;
  }): Promise<SuggestFieldsResponse> =>
    axios.post(route('api.v1.ai.suggest-fields'), payload).then((r) => r.data),

  chatProcess: (payload: {
    message: string;
    source: string;
    context: Record<string, unknown>;
  }): Promise<ChatProcessResponse> =>
    axios.post('/ai-chat/process', payload).then((r) => r.data),
};
