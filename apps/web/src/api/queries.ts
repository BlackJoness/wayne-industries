import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { apiRequest } from './client';
import type {
  AccessLog,
  Area,
  AreaClearance,
  AuthUser,
  DashboardSummary,
  Paginated,
  Resource,
  ResourceStatus,
  ResourceType,
  Role,
} from './types';

/* ---------- Dashboard ---------- */

export function useDashboard(): UseQueryResult<DashboardSummary> {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest<DashboardSummary>('/dashboard'),
    refetchInterval: 60_000,
  });
}

/* ---------- Recursos ---------- */

export interface ResourceFilters {
  page: number;
  search?: string;
  type?: ResourceType | '';
  status?: ResourceStatus | '';
}

export function useResources(filters: ResourceFilters) {
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: () =>
      apiRequest<Paginated<Resource>>('/resources', {
        query: {
          page: filters.page,
          perPage: 8,
          search: filters.search || undefined,
          type: filters.type || undefined,
          status: filters.status || undefined,
        },
      }),
    placeholderData: (previous) => previous,
  });
}

export interface ResourcePayload {
  name: string;
  description?: string;
  type: ResourceType;
  serialNumber: string;
  status: ResourceStatus;
  areaId?: string | null;
  acquiredAt: string;
  value?: number;
}

export function useSaveResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: ResourcePayload }) =>
      id
        ? apiRequest<Resource>(`/resources/${id}`, { method: 'PATCH', body: payload })
        : apiRequest<Resource>('/resources', { method: 'POST', body: payload }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resources'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/resources/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resources'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/* ---------- Áreas ---------- */

export function useAreas(): UseQueryResult<Area[]> {
  return useQuery({ queryKey: ['areas'], queryFn: () => apiRequest<Area[]>('/areas') });
}

export function useSaveArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: Record<string, unknown> }) =>
      id
        ? apiRequest<Area>(`/areas/${id}`, { method: 'PATCH', body: payload })
        : apiRequest<Area>('/areas', { method: 'POST', body: payload }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['areas'] });
      void queryClient.invalidateQueries({ queryKey: ['clearance'] });
    },
  });
}

export function useGrantPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ areaId, userId }: { areaId: string; userId: string }) =>
      apiRequest<Area>(`/areas/${areaId}/permissions`, { method: 'POST', body: { userId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['areas'] });
      void queryClient.invalidateQueries({ queryKey: ['clearance'] });
    },
  });
}

export function useRevokePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ areaId, userId }: { areaId: string; userId: string }) =>
      apiRequest<Area>(`/areas/${areaId}/permissions/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['areas'] });
      void queryClient.invalidateQueries({ queryKey: ['clearance'] });
    },
  });
}

/* ---------- Controle de acesso ---------- */

export function useClearance(): UseQueryResult<AreaClearance[]> {
  return useQuery({ queryKey: ['clearance'], queryFn: () => apiRequest<AreaClearance[]>('/access/clearance') });
}

export function useAccessAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (areaId: string) =>
      apiRequest<{ result: 'GRANTED' | 'DENIED'; reason: string }>('/access/attempt', {
        method: 'POST',
        body: { areaId },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['access-logs'] });
      void queryClient.invalidateQueries({ queryKey: ['my-history'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAccessLogs(page: number, scope: 'all' | 'mine') {
  return useQuery({
    queryKey: [scope === 'all' ? 'access-logs' : 'my-history', page],
    queryFn: () =>
      apiRequest<Paginated<AccessLog>>(scope === 'all' ? '/access/logs' : '/access/my-history', {
        query: { page, perPage: 10 },
      }),
    placeholderData: (previous) => previous,
  });
}

/* ---------- Usuários ---------- */

export function useUsers(page = 1, search = '') {
  return useQuery({
    queryKey: ['users', page, search],
    queryFn: () =>
      apiRequest<Paginated<AuthUser>>('/users', { query: { page, perPage: 10, search: search || undefined } }),
    placeholderData: (previous) => previous,
  });
}

export function useSaveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: Record<string, unknown> }) =>
      id
        ? apiRequest<AuthUser>(`/users/${id}`, { method: 'PATCH', body: payload })
        : apiRequest<AuthUser>('/users', { method: 'POST', body: payload }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: 'EMPLOYEE', label: 'Funcionário' },
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'SECURITY_ADMIN', label: 'Administrador de Segurança' },
];
