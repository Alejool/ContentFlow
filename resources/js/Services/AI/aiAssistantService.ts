import axios from 'axios';
import { route } from 'ziggy-js';

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

export interface ComposerSuggestion {
  headline?: string;
  tip?: string;
  cta?: string;
  /** Only present when source is 'heuristic' — whether the workspace has publishing history. */
  has_history?: boolean;
  suggested_time: string;
  source: 'ai' | 'heuristic';
}

export const aiAssistantService = {
  composerAssistant: (payload: {
    platforms: string[];
    draft?: string;
    timezone?: string;
    locale?: string;
  }): Promise<{ success: boolean; data: ComposerSuggestion }> =>
    axios.post(route('api.v1.ai.composer-assistant'), payload).then((r) => r.data),

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
