/**
 * TypeScript types matching backend models
 */

// User Roles
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
  PUBLIC = 'PUBLIC',
}

// User Model
export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  is_approved: boolean;
  is_admin: boolean;
  can_manage: boolean;
  can_view_full: boolean;
  approved_by_id?: number;
  approved_at?: string;
  rejected_at?: string;
  last_login_at?: string;
  login_count: number;
  created_at: string;
  updated_at: string;
}

// Token Response
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

// Login Response
export interface LoginResponse {
  token: TokenResponse;
  user: User;
  message: string;
}

// API Error
export interface ApiError {
  detail: string;
  status?: number;
}

// Pagination
export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

// User List Response
export type UserListResponse = PaginatedResponse<User>;

// User Update
export interface UserUpdate {
  name?: string;
  avatar_url?: string;
  is_active?: boolean;
}

// User Approval
export interface UserApprovalRequest {
  role: UserRole;
}

// User Role Update
export interface UserRoleUpdate {
  role: UserRole;
}

// Lead Status
export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
}

// Lead Model
export interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  source: string;
  status: LeadStatus;
  notes?: string;
  estimated_value?: number;
  created_at: string;
  updated_at: string;
}

// Activity Model
export interface Activity {
  id: number;
  lead_id: number;
  activity_type: string;
  description: string;
  created_at: string;
}

// Note Model
export interface Note {
  id: number;
  lead_id: number;
  content: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Chat Session
export interface ChatSession {
  id: number;
  session_id: string;
  lead_id?: number;
  started_at: string;
  ended_at?: string;
  is_active: boolean;
}

// Chat Message
export interface ChatMessage {
  id: number;
  session_id: number;
  message: string;
  is_from_user: boolean;
  created_at: string;
}
