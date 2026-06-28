import { describe, it, expect } from 'vitest';
import { rejectionSchema } from '@/schemas/Approval/rejection';

describe('rejectionSchema', () => {
  it('accepts valid reason', () => {
    const result = rejectionSchema.safeParse({ reason: 'This needs more detail please fix it' });
    expect(result.success).toBe(true);
  });

  it('rejects reason shorter than 10 chars', () => {
    const result = rejectionSchema.safeParse({ reason: 'Too short' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['reason']);
  });

  it('rejects reason longer than 500 chars', () => {
    const result = rejectionSchema.safeParse({ reason: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('rejects empty reason', () => {
    const result = rejectionSchema.safeParse({ reason: '' });
    expect(result.success).toBe(false);
  });
});
