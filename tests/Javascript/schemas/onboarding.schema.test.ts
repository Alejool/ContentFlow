import { describe, it, expect } from 'vitest';
import { businessInfoSchema } from '@/schemas/Onboarding/businessInfo';

describe('businessInfoSchema', () => {
  const valid = {
    businessName: 'Acme Corp',
    businessIndustry: 'Technology',
    businessSize: '10-50',
    businessGoals: 'Grow social presence',
  };

  it('accepts valid business info', () => {
    expect(businessInfoSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts without optional businessGoals', () => {
    const { businessGoals, ...rest } = valid;
    expect(businessInfoSchema.safeParse(rest).success).toBe(true);
  });

  it('rejects empty businessName', () => {
    const result = businessInfoSchema.safeParse({ ...valid, businessName: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['businessName']);
  });

  it('rejects empty businessIndustry', () => {
    const result = businessInfoSchema.safeParse({ ...valid, businessIndustry: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty businessSize', () => {
    const result = businessInfoSchema.safeParse({ ...valid, businessSize: '' });
    expect(result.success).toBe(false);
  });
});
