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
} from './types';

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    headers: {
      'Content-Type': 'application/json',
    },
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
      if (error.response?.status === 401) {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const response = await axios.post<TokenResponse>(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
              { refresh_token: refreshToken }
            );

            const { access_token } = response.data;
            localStorage.setItem('access_token', access_token);

            // Retry original request
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${access_token}`;
              return client.request(error.config);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        } else {
          // No refresh token, redirect to login
          window.location.href = '/login';
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
};

// Export all API modules
export default {
  auth: authApi,
  users: usersApi,
  leads: leadsApi,
};
