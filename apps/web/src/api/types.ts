export type Role = 'EMPLOYEE' | 'MANAGER' | 'SECURITY_ADMIN';
export type ResourceType = 'EQUIPMENT' | 'VEHICLE' | 'SECURITY_DEVICE';
export type ResourceStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';
export type AccessResult = 'GRANTED' | 'DENIED';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  jobTitle: string | null;
  isActive: boolean;
}

export interface PageMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface AreaBrief {
  id: string;
  name: string;
  code: string;
}

export interface Resource {
  id: string;
  name: string;
  description: string | null;
  type: ResourceType;
  serialNumber: string;
  status: ResourceStatus;
  acquiredAt: string;
  value: number | null;
  area: AreaBrief | null;
  createdAt: string;
  updatedAt: string;
}

export interface Area {
  id: string;
  name: string;
  code: string;
  description: string | null;
  minimumRole: Role;
  minimumRoleLabel: string;
  isActive: boolean;
  resourceCount: number;
  permissions: Array<{ userId: string; userName: string; userEmail: string; expiresAt: string | null }>;
}

export interface AreaClearance {
  areaId: string;
  name: string;
  code: string;
  description: string | null;
  minimumRoleLabel: string;
  allowed: boolean;
  reason: string;
}

export interface AccessLog {
  id: string;
  result: AccessResult;
  reason: string;
  createdAt: string;
  user: { id: string; name: string; role: Role; roleLabel: string };
  area: AreaBrief;
}

export interface DashboardSummary {
  totals: {
    resources: number;
    activeUsers: number;
    areas: number;
    estimatedValue: number;
    grantedLast7Days: number;
    deniedLast7Days: number;
  };
  resourcesByType: Array<{ key: ResourceType; label: string; total: number }>;
  resourcesByStatus: Array<{ key: ResourceStatus; label: string; total: number }>;
  accessTrend: Array<{ date: string; label: string; granted: number; denied: number }>;
  topDeniedAreas: Array<{ areaId: string; name: string; code: string; total: number }>;
  recentAccess: Array<{ id: string; result: AccessResult; reason: string; createdAt: string; userName: string; areaName: string }>;
  recentActivity: Array<{ id: string; createdAt: string; actorName: string; description: string }>;
}
