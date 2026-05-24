import { queryKeys } from '@/lib/common/queryKeys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WorkspaceMember {
  id: number;
  name: string;
  email: string;
  photo_url?: string;
  pivot?: {
    role_id: number;
    role?: { slug: string; name: string };
  };
  role?: { slug: string; name: string };
}

interface MembersResponse {
  members: WorkspaceMember[];
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

async function fetchMembersFn(workspaceId: number): Promise<WorkspaceMember[]> {
  const response = await axios.get<MembersResponse>(
    route('api.v1.workspaces.members', workspaceId),
  );
  return response.data.members ?? [];
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useWorkspaceMembers(workspaceId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.members.list(workspaceId!),
    queryFn: () => fetchMembersFn(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 min — members change infrequently
  });
}

export function useUpdateMemberRole(
  workspaceId: number,
  /** Pass all available roles so the optimistic update can resolve slug+name immediately */
  roles: Array<{ id: number; slug: string; name: string }> = [],
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      axios.put(
        route('api.v1.workspaces.members.update-role', {
          idOrSlug: workspaceId,
          user: userId,
        }),
        { role_id: roleId },
      ),
    /**
     * Optimistic update: swap role_id AND role slug/name immediately in cache.
     * Without patching pivot.role the badge & trigger icon would stay stale
     * until the background refetch completes.
     */
    onMutate: async ({ userId, roleId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.members.list(workspaceId) });
      const prev = queryClient.getQueryData<WorkspaceMember[]>(queryKeys.members.list(workspaceId));
      const newRole = roles.find((r) => r.id === roleId);
      queryClient.setQueryData<WorkspaceMember[]>(
        queryKeys.members.list(workspaceId),
        (old) =>
          old?.map((m) =>
            m.id === userId && m.pivot
              ? {
                  ...m,
                  pivot: {
                    ...m.pivot,
                    role_id: roleId,
                    // Patch slug & name so the UI reflects the change instantly
                    role: newRole
                      ? { slug: newRole.slug, name: newRole.name }
                      : m.pivot.role,
                  },
                }
              : m,
          ) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.members.list(workspaceId), ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.list(workspaceId) });
    },
  });
}

export function useRemoveWorkspaceMember(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) =>
      axios.delete<MembersResponse>(`/api/v1/workspaces/${workspaceId}/members/${userId}`),
    // Optimistic update: remove member immediately
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.members.list(workspaceId) });
      const prev = queryClient.getQueryData<WorkspaceMember[]>(queryKeys.members.list(workspaceId));
      queryClient.setQueryData<WorkspaceMember[]>(
        queryKeys.members.list(workspaceId),
        (old) => old?.filter((m) => m.id !== userId) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.members.list(workspaceId), ctx.prev);
      }
    },
    onSuccess: (res) => {
      // If backend returns updated list, use it directly
      if (res.data?.members) {
        queryClient.setQueryData(queryKeys.members.list(workspaceId), res.data.members);
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.members.list(workspaceId) });
      }
    },
  });
}
