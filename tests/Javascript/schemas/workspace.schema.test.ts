import { describe, it, expect } from 'vitest';
import { getCreateWorkspaceSchema } from '@/schemas/Workspace/createWorkspace';
import { getInviteMemberSchema } from '@/schemas/Workspace/inviteMember';

const t = (key: string) => key;

describe('getCreateWorkspaceSchema', () => {
  it('accepts valid workspace', () => {
    const result = getCreateWorkspaceSchema(t).safeParse({ name: 'My Workspace', description: 'A test workspace' });
    expect(result.success).toBe(true);
  });

  it('accepts without optional description', () => {
    const result = getCreateWorkspaceSchema(t).safeParse({ name: 'My Workspace' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = getCreateWorkspaceSchema(t).safeParse({ name: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['name']);
  });

  it('rejects name over 255 chars', () => {
    const result = getCreateWorkspaceSchema(t).safeParse({ name: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('rejects description over 1000 chars', () => {
    const result = getCreateWorkspaceSchema(t).safeParse({ name: 'Valid', description: 'a'.repeat(1001) });
    expect(result.success).toBe(false);
  });
});

describe('getInviteMemberSchema', () => {
  it('accepts valid invite', () => {
    const result = getInviteMemberSchema(t).safeParse({ email: 'user@example.com', role_id: 1 });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = getInviteMemberSchema(t).safeParse({ email: 'not-an-email', role_id: 1 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['email']);
  });

  it('rejects missing role_id', () => {
    const result = getInviteMemberSchema(t).safeParse({ email: 'user@example.com', role_id: 0 });
    expect(result.success).toBe(false);
  });
});
