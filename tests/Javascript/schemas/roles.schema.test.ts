import { describe, it, expect } from 'vitest';
import { createRoleSchema } from '@/schemas/Roles/createRole';

describe('createRoleSchema', () => {
  const valid = {
    name: 'Editor',
    description: 'Can edit publications',
    permissions: [1, 2, 3],
    approval_participant: false,
  };

  it('accepts valid role', () => {
    expect(createRoleSchema.safeParse(valid).success).toBe(true);
  });

  it('uses defaults for permissions and approval_participant', () => {
    const result = createRoleSchema.safeParse({ name: 'Editor' });
    expect(result.success).toBe(true);
    expect(result.data?.permissions).toEqual([]);
    expect(result.data?.approval_participant).toBe(false);
  });

  it('rejects empty name', () => {
    const result = createRoleSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['name']);
  });

  it('rejects name over 255 chars', () => {
    const result = createRoleSchema.safeParse({ ...valid, name: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });
});
