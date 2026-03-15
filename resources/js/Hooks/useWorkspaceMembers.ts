import { queryKeys } from '@/lib/queryKeys';
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

export function useUpdateMemberRole(workspaceId: number) {
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
    // Optimistic update: swap role immediately in cache
    onMutate: async ({ userId, roleId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.members.list(workspaceId) });
      const prev = queryClient.getQueryData<WorkspaceMember[]>(queryKeys.members.list(workspaceId));
      queryClient.setQueryData<WorkspaceMember[]>(
        queryKeys.members.list(workspaceId),
        (old) =>
          old?.map((m) =>
            m.id === userId && m.pivot ? { ...m, pivot: { ...m.pivot, role_id: roleId } } : m,
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
      axios.delete<MembersResponse>(
        route('api.v1.workspaces.members.remove', {
          idOrSlug: workspaceId,
          user: userId,
        }),
      ),
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
