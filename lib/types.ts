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

// Lead Status (lowercase to match backend enum values)
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
}

// Lead Model
export interface Lead {
  id: number;

  // Primary Contact Information
  name: string;
  email?: string;
  phone?: string;
  company?: string;

  // Lead Details
  status: LeadStatus;
  source: string;
  priority?: number; // 1=High, 3=Normal, 5=Low

  // Location
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;

  // Additional Contact Details
  email_2?: string;
  phone_2?: string;
  phone_3?: string;
  phone_4?: string;
  landline_1?: string;
  landline_2?: string;
  landline_3?: string;
  landline_4?: string;

  // Mailing Address (if different from physical address)
  mailing_address?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip?: string;

  // Additional Owner Information
  owner_1_first_name?: string;
  owner_1_last_name?: string;
  owner_2_first_name?: string;
  owner_2_last_name?: string;

  // Data Source Tracking
  source_file?: string;

  // Business Information
  service_interest?: string;
  estimated_value?: number;
  project_timeline?: string;

  // Communication Preferences
  preferred_contact_method?: string;
  preferred_contact_time?: string;

  // Assignment
  assigned_to?: string;

  // External IDs (for integration)
  telegram_user_id?: string;
  telegram_username?: string;
  n8n_workflow_id?: string;
  external_id?: string;

  // Dates
  first_contact_date?: string;
  last_contact_date?: string;
  next_followup_date?: string;

  // Additional Information
  notes_summary?: string;
  notes?: string;
  tags?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  deleted_at?: string;
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

// Enums for Chat
export enum MessageSender {
  LEAD = 'lead',
  AGENT = 'agent',
  BOT = 'bot',
  SYSTEM = 'system',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  VIDEO = 'video',
  LOCATION = 'location',
  CONTACT = 'contact',
  STICKER = 'sticker',
  SYSTEM_NOTIFICATION = 'system_notification',
}

export enum SessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  TRANSFERRED = 'transferred',
}

export enum SessionChannel {
  TELEGRAM = 'telegram',
  WEB_CHAT = 'web_chat',
  WEBHOOK = 'webhook',
}

// Chat Message
export interface ChatMessage {
  id: number;
  session_id: number;
  sender_type: MessageSender;
  sender_id?: string;
  sender_name?: string;
  message_type: MessageType;
  content: string;
  is_read: boolean;
  read_at?: string;
  is_delivered: boolean;
  delivered_at?: string;
  reply_to_message_id?: number;
  thread_id?: string;
  media_url?: string;
  media_size?: number;
  media_mime_type?: string;
  media_filename?: string;
  external_id?: string;
  telegram_message_id?: string;
  n8n_execution_id?: string;
  processed_by_ai: boolean;
  ai_response_time_ms?: number;
  ai_model_used?: string;
  created_at: string;
  updated_at: string;
}

// Chat Session
export interface ChatSession {
  id: number;
  lead_id: number;
  session_id: string;
  channel: SessionChannel;
  status: SessionStatus;
  started_at?: string;
  ended_at?: string;
  last_activity_at?: string;
  handled_by?: string;
  transferred_to?: string;
  transferred_at?: string;
  satisfaction_rating?: number;
  satisfaction_feedback?: string;
  external_id?: string;
  telegram_chat_id?: string;
  n8n_execution_id?: string;
  initial_message?: string;
  summary?: string;
  tags?: string;
  message_count: number;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

// Chat Session with Messages
export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
}

// List Responses
export interface ChatMessageListResponse {
  total: number;
  page: number;
  page_size: number;
  items: ChatMessage[];
}

export interface ChatSessionListResponse {
  total: number;
  page: number;
  page_size: number;
  items: ChatSession[];
}

// Telegram Bot Status
export interface TelegramBotStatus {
  status: 'running' | 'stopped';
  bot_username: string;
  ready: boolean;
}

// Telegram Send Message Request
export interface TelegramSendMessageRequest {
  lead_id: number;
  message: string;
}

// Telegram Send Message Response
export interface TelegramSendMessageResponse {
  success: boolean;
  message_id?: string;
  error?: string;
}
