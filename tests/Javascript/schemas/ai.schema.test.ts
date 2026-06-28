import { describe, it, expect } from 'vitest';
import { getAiPromptSchema } from '@/schemas/AI/aiPrompt';

const t = (key: string) => key;

describe('aiPromptSchema', () => {
  it('accepts valid prompt', () => {
    const result = getAiPromptSchema(t).safeParse({ prompt: 'Write a post about our new product launch' });
    expect(result.success).toBe(true);
  });

  it('rejects prompt shorter than 10 chars', () => {
    const result = getAiPromptSchema(t).safeParse({ prompt: 'Short' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['prompt']);
  });

  it('rejects prompt longer than 500 chars', () => {
    const result = getAiPromptSchema(t).safeParse({ prompt: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('rejects empty prompt', () => {
    const result = getAiPromptSchema(t).safeParse({ prompt: '' });
    expect(result.success).toBe(false);
  });
});
