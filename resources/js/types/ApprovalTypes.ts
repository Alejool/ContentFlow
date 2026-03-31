// Tipos para el nuevo sistema de aprobaciones simplificado

import type { Publication } from '@/types/Publication';

export interface ApprovalRequest {
  id: number;
  publication_id: number;
  workflow_id: number;
  current_step_id: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submitted_by: number;
  submitted_at: string;
  completed_at: string | null;
  completed_by: number | null;
  rejection_reason: string | null;
  metadata: Record<string, unknown> | null;

  // Relaciones
  publication?: Publication;
  workflow?: ApprovalWorkflow;
  currentStep?: ApprovalLevel;
  submitter?: User;
  completedBy?: User;
  logs?: ApprovalLog[];
}

export interface ApprovalLog {
  id: number;
  approval_request_id: number;
  approval_step_id: number | null;
  user_id: number | null;
  action: 'submitted' | 'approved' | 'rejected' | 'reassigned' | 'cancelled' | 'auto_advanced';
  level_number: number | null;
  comment: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;

  // Relaciones
  approvalRequest?: ApprovalRequest;
  approvalStep?: ApprovalLevel;
  user?: User;
}

export interface ApprovalLevel {
  id: number;
  approval_workflow_id: number;
  level_number: number;
  level_name: string;
  role_id: number | null;
  user_id: number | null;
  require_all_users: boolean;
  auto_advance: boolean;
  description: string | null;

  // Relaciones
  workflow?: ApprovalWorkflow;
  role?: Role;
  user?: User;
  users?: User[];
}

export interface ApprovalWorkflow {
  id: number;
  workspace_id: number;
  name: string;
  is_active: boolean;
  is_enabled: boolean;
  is_multi_level: boolean;

  // Relaciones
  levels?: ApprovalLevel[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  photo_url?: string;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  slug: string;
}

// Respuestas de API
export interface ApprovalHistoryResponse {
  success: boolean;
  history: ApprovalRequest[];
  count: number;
}

export interface PendingApprovalsResponse {
  success: boolean;
  requests: ApprovalRequest[];
  count: number;
}

export interface ApprovalStatusResponse {
  success: boolean;
  request: ApprovalRequest;
  is_pending: boolean;
  is_approved: boolean;
  is_rejected: boolean;
  is_cancelled: boolean;
  rejection_details?: {
    level_number: number;
    step_name: string;
    rejected_by: User;
    rejected_at: string;
    reason: string;
  };
}
