/**
 * API Client for Backend Communication
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  User,
  LoginResponse,
  TokenResponse,
  UserListResponse,
  UserUpdate,
  UserApprovalRequest,
  UserRoleUpdate,
  Lead,
  Activity,
  Note,
  ApiError,
  ChatSession,
  ChatSessionDetail,
  ChatSessionListResponse,
  ChatMessage,
  ChatMessageListResponse,
  TelegramBotStatus,
  TelegramSendMessageRequest,
  TelegramSendMessageResponse,
  MessageSender,
  MessageType,
  SessionStatus,
  SessionChannel,
} from './types';

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 300000, // 5 minutes default timeout for long-running operations
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config;

      // Handle 401 (Unauthorized) - Token expired or invalid
      if (error.response?.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken && originalRequest) {
          try {
            const response = await axios.post<TokenResponse>(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
              { refresh_token: refreshToken }
            );

            const { access_token } = response.data;
            localStorage.setItem('access_token', access_token);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return client.request(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(error);
          }
        } else {
          // No refresh token, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }

      // Handle 403 (Forbidden) - Could be due to expired session or insufficient permissions
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.detail || '';

        // Check if it's a session-related 403 (expired, not approved, deactivated)
        if (
          errorMessage.includes('expired') ||
          errorMessage.includes('invalid') ||
          errorMessage.includes('deactivated') ||
          errorMessage.includes('not active') ||
          errorMessage.includes('pending approval')
        ) {
          // Session issue - try to refresh token
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken && originalRequest) {
            try {
              const response = await axios.post<TokenResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
                { refresh_token: refreshToken }
              );

              const { access_token } = response.data;
              localStorage.setItem('access_token', access_token);

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              return client.request(originalRequest);
            } catch (refreshError) {
              // Refresh failed, clear tokens and redirect to login
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
              return Promise.reject(error);
            }
          } else {
            // No refresh token, redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(error);
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Export singleton instance
export const api = createApiClient();

// Authentication API
export const authApi = {
  // Login with Google
  googleLogin: async (googleToken: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/google', {
      token: googleToken,
    });
    return response.data;
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  // Logout
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  // Verify token
  verifyToken: async (token: string): Promise<{ valid: boolean; user_id?: number; email?: string; role?: string }> => {
    const response = await api.post('/auth/verify', { token });
    return response.data;
  },
};

// Users API
export const usersApi = {
  // Get current user profile
  getMyProfile: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  // Get pending users (admin only)
  getPendingUsers: async (page = 1, pageSize = 20): Promise<UserListResponse> => {
    const response = await api.get<UserListResponse>('/users/pending', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  // List users with filters
  listUsers: async (params?: {
    page?: number;
    page_size?: number;
    role?: string;
    is_active?: boolean;
    is_approved?: boolean;
    search?: string;
  }): Promise<UserListResponse> => {
    const response = await api.get<UserListResponse>('/users', { params });
    return response.data;
  },

  // Get user by ID
  getUser: async (userId: number): Promise<User> => {
    const response = await api.get<User>(`/users/${userId}`);
    return response.data;
  },

  // Update user
  updateUser: async (userId: number, data: UserUpdate): Promise<User> => {
    const response = await api.patch<User>(`/users/${userId}`, data);
    return response.data;
  },

  // Approve user
  approveUser: async (userId: number, data: UserApprovalRequest): Promise<User> => {
    const response = await api.post<User>(`/users/${userId}/approve`, data);
    return response.data;
  },

  // Reject user
  rejectUser: async (userId: number): Promise<User> => {
    const response = await api.post<User>(`/users/${userId}/reject`);
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId: number, data: UserRoleUpdate): Promise<User> => {
    const response = await api.patch<User>(`/users/${userId}/role`, data);
    return response.data;
  },

  // Deactivate user
  deactivateUser: async (userId: number): Promise<User> => {
    const response = await api.post<User>(`/users/${userId}/deactivate`);
    return response.data;
  },

  // Reactivate user
  reactivateUser: async (userId: number): Promise<User> => {
    const response = await api.post<User>(`/users/${userId}/reactivate`);
    return response.data;
  },
};

// Leads API
export const leadsApi = {
  // List leads
  listLeads: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    source?: string;
    search?: string;
    city?: string;
    state?: string;
    name?: string;
    phone?: string;
    email?: string;
  }): Promise<{ total: number; page: number; page_size: number; items: Lead[] }> => {
    const response = await api.get('/leads', { params });
    return response.data;
  },

  // Get lead by ID
  getLead: async (leadId: number): Promise<Lead> => {
    const response = await api.get<Lead>(`/leads/${leadId}`);
    return response.data;
  },

  // Create lead
  createLead: async (data: Partial<Lead>): Promise<Lead> => {
    const response = await api.post<Lead>('/leads', data);
    return response.data;
  },

  // Update lead
  updateLead: async (leadId: number, data: Partial<Lead>): Promise<Lead> => {
    const response = await api.patch<Lead>(`/leads/${leadId}`, data);
    return response.data;
  },

  // Delete lead
  deleteLead: async (leadId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/leads/${leadId}`);
    return response.data;
  },

  // Get lead activities
  getLeadActivities: async (leadId: number): Promise<Activity[]> => {
    const response = await api.get<Activity[]>(`/leads/${leadId}/activities`);
    return response.data;
  },

  // Get lead notes
  getLeadNotes: async (leadId: number): Promise<Note[]> => {
    const response = await api.get<Note[]>(`/leads/${leadId}/notes`);
    return response.data;
  },

  // Import leads from Excel file
  importLeads: async (file: File): Promise<{
    success: boolean;
    created: number;
    total_rows: number;
    errors?: Array<{ row: number; error: string }>;
    message: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/leads/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Remove duplicate leads
  removeDuplicates: async (): Promise<{
    success: boolean;
    message: string;
    statistics: {
      total_leads_before: number;
      unique_combinations: number;
      duplicates_removed: number;
      remaining_leads: number;
    };
  }> => {
    const response = await api.post('/leads/remove-duplicates');
    return response.data;
  },

  // Bulk delete all leads
  bulkDelete: async (confirmation: string, hardDelete: boolean = false): Promise<{
    success: boolean;
    message: string;
    statistics: {
      deleted_count: number;
      delete_type: string;
    };
  }> => {
    const response = await api.delete('/leads/bulk-delete', {
      params: {
        confirmation,
        hard_delete: hardDelete,
      },
    });
    return response.data;
  },

  // Get geographic statistics
  getGeographicStats: async (): Promise<{
    success: boolean;
    data: {
      total_leads: number;
      total_states: number;
      total_cities: number;
      states: Array<{
        state: string;
        total_leads: number;
        total_cities: number;
        statuses: Record<string, number>;
        sources: Record<string, number>;
      }>;
      cities: Array<{
        city: string;
        state: string;
        total_leads: number;
        statuses: Record<string, number>;
        sources: Record<string, number>;
        avg_priority: number;
      }>;
    };
  }> => {
    const response = await api.get('/leads/geographic-stats');
    return response.data;
  },
};

// ==================== Chat Sessions API ====================
export const chatSessionsApi = {
  // Get all sessions for a lead
  getSessionsByLead: async (leadId: number): Promise<ChatSessionListResponse> => {
    const response = await api.get(`/chat-sessions/lead/${leadId}/sessions`);
    return response.data;
  },

  // Get active sessions for a lead
  getActiveSessionsByLead: async (leadId: number): Promise<ChatSessionListResponse> => {
    const response = await api.get(`/chat-sessions/lead/${leadId}/active`);
    return response.data;
  },

  // Get a session with all messages
  getSession: async (sessionId: number): Promise<ChatSessionDetail> => {
    const response = await api.get(`/chat-sessions/${sessionId}`);
    return response.data;
  },

  // List all chat sessions with optional filters
  listSessions: async (params?: {
    page?: number;
    page_size?: number;
    lead_id?: number;
    channel?: SessionChannel;
    status?: SessionStatus;
  }): Promise<ChatSessionListResponse> => {
    const response = await api.get('/chat-sessions', { params });
    return response.data;
  },

  // Create a new chat session
  createSession: async (data: {
    lead_id: number;
    session_id: string;
    channel: SessionChannel;
    status?: SessionStatus;
    telegram_chat_id?: string;
    initial_message?: string;
  }): Promise<ChatSession> => {
    const response = await api.post('/chat-sessions', data);
    return response.data;
  },

  // End a chat session
  endSession: async (sessionId: number): Promise<ChatSession> => {
    const response = await api.post(`/chat-sessions/${sessionId}/end`);
    return response.data;
  },
};

// ==================== Chat Messages API ====================
export const chatMessagesApi = {
  // Get all messages for a session
  getMessagesBySession: async (sessionId: number): Promise<ChatMessageListResponse> => {
    const response = await api.get(`/chat-messages/session/${sessionId}/messages`);
    return response.data;
  },

  // List chat messages with optional filters
  listMessages: async (params?: {
    page?: number;
    page_size?: number;
    session_id?: number;
    sender_type?: MessageSender;
    message_type?: MessageType;
    is_read?: boolean;
    processed_by_ai?: boolean;
  }): Promise<ChatMessageListResponse> => {
    const response = await api.get('/chat-messages', { params });
    return response.data;
  },

  // Create a new chat message
  createMessage: async (data: {
    session_id: number;
    sender_type: MessageSender;
    sender_id?: string;
    sender_name?: string;
    message_type?: MessageType;
    content: string;
    telegram_message_id?: string;
  }): Promise<ChatMessage> => {
    const response = await api.post('/chat-messages', data);
    return response.data;
  },

  // Get a single message
  getMessage: async (messageId: number): Promise<ChatMessage> => {
    const response = await api.get(`/chat-messages/${messageId}`);
    return response.data;
  },

  // Mark a message as read
  markAsRead: async (messageId: number): Promise<ChatMessage> => {
    const response = await api.post(`/chat-messages/${messageId}/mark-read`);
    return response.data;
  },

  // Mark all messages in a session as read
  markSessionMessagesAsRead: async (sessionId: number): Promise<void> => {
    await api.post(`/chat-messages/session/${sessionId}/mark-all-read`);
  },
};

// ==================== Telegram API ====================
export const telegramApi = {
  // Send a message to a lead via Telegram
  sendMessage: async (
    leadId: number,
    message: string
  ): Promise<TelegramSendMessageResponse> => {
    const response = await api.post('/telegram/send', {
      lead_id: leadId,
      message,
    } as TelegramSendMessageRequest);
    return response.data;
  },

  // Get Telegram bot status
  getBotStatus: async (): Promise<TelegramBotStatus> => {
    const response = await api.get('/telegram/status');
    return response.data;
  },
};

// Export all API modules
export default {
  auth: authApi,
  users: usersApi,
  leads: leadsApi,
};
