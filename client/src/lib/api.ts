import axios, { AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  AuthResponse, 
  Transaction, 
  TransactionSummary, 
  CategoryBreakdown, 
  MonthlyTrend,
  DashboardStats,
  CreateTransactionData,
  UpdateTransactionData,
  TransactionFilters,
  User
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response: AxiosResponse<ApiResponse<null>> = await api.post('/auth/logout');
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/auth/profile');
    return response.data;
  },
};

// Transactions API
export const transactionsAPI = {
  getTransactions: async (filters?: TransactionFilters): Promise<ApiResponse<Transaction[]>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response: AxiosResponse<ApiResponse<Transaction[]>> = await api.get(
      `/transactions?${params.toString()}`
    );
    return response.data;
  },

  getTransaction: async (id: string): Promise<ApiResponse<Transaction>> => {
    const response: AxiosResponse<ApiResponse<Transaction>> = await api.get(`/transactions/${id}`);
    return response.data;
  },

  createTransaction: async (data: CreateTransactionData): Promise<ApiResponse<Transaction>> => {
    const response: AxiosResponse<ApiResponse<Transaction>> = await api.post('/transactions', data);
    return response.data;
  },

  updateTransaction: async (data: UpdateTransactionData): Promise<ApiResponse<Transaction>> => {
    const { id, ...updateData } = data;
    const response: AxiosResponse<ApiResponse<Transaction>> = await api.put(
      `/transactions/${id}`,
      updateData
    );
    return response.data;
  },

  deleteTransaction: async (id: string): Promise<ApiResponse<null>> => {
    const response: AxiosResponse<ApiResponse<null>> = await api.delete(`/transactions/${id}`);
    return response.data;
  },

  bulkDeleteTransactions: async (ids: string[]): Promise<ApiResponse<null>> => {
    const response: AxiosResponse<ApiResponse<null>> = await api.delete('/transactions/bulk/delete', {
      data: { ids },
    });
    return response.data;
  },

  getTransactionSummary: async (
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<TransactionSummary>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response: AxiosResponse<ApiResponse<TransactionSummary>> = await api.get(
      `/transactions/analytics/summary?${params.toString()}`
    );
    return response.data;
  },

  getCategoryBreakdown: async (
    type: 'income' | 'expense',
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<CategoryBreakdown[]>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response: AxiosResponse<ApiResponse<CategoryBreakdown[]>> = await api.get(
      `/transactions/analytics/categories/${type}?${params.toString()}`
    );
    return response.data;
  },

  getMonthlyTrends: async (
    months?: number
  ): Promise<ApiResponse<MonthlyTrend[]>> => {
    const params = new URLSearchParams();
    if (months) params.append('months', months.toString());

    const response: AxiosResponse<ApiResponse<MonthlyTrend[]>> = await api.get(
      `/transactions/analytics/trends?${params.toString()}`
    );
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put('/users/profile', data);
    return response.data;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<null>> => {
    const response: AxiosResponse<ApiResponse<null>> = await api.put('/users/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  deleteAccount: async (): Promise<ApiResponse<null>> => {
    const response: AxiosResponse<ApiResponse<null>> = await api.delete('/users/account');
    return response.data;
  },

  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response: AxiosResponse<ApiResponse<DashboardStats>> = await api.get('/users/dashboard');
    return response.data;
  },

  exportUserData: async (): Promise<Blob> => {
    const response = await api.get('/users/export', {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async (): Promise<{ message: string; timestamp: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;