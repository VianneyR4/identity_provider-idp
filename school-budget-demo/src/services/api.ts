import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, LoginRequest, LoginResponse, User, Budget } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:8080/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await this.refreshToken(refreshToken);
              if (response.success && response.data) {
                localStorage.setItem('accessToken', response.data.accessToken);
                // Retry the original request
                const originalRequest = error.config;
                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                return this.api.request(originalRequest);
              }
            } catch (refreshError) {
              // Refresh failed, redirect to login
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
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
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<LoginResponse>> = await this.api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ accessToken: string }>> = await this.api.post('/auth/refresh', {
        refreshToken
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Token refresh failed'
      };
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await this.api.post('/auth/logout');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Logout failed'
      };
    }
  }

  // User Management
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/users/me');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch user data'
      };
    }
  }

  async getUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response: AxiosResponse<ApiResponse<User[]>> = await this.api.get('/users');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch users'
      };
    }
  }

  // Budget Management
  async getBudgets(): Promise<ApiResponse<Budget[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Budget[]>> = await this.api.get('/budgets');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch budgets'
      };
    }
  }

  async createBudget(budget: Partial<Budget>): Promise<ApiResponse<Budget>> {
    try {
      const response: AxiosResponse<ApiResponse<Budget>> = await this.api.post('/budgets', budget);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create budget'
      };
    }
  }

  async updateBudget(id: number, budget: Partial<Budget>): Promise<ApiResponse<Budget>> {
    try {
      const response: AxiosResponse<ApiResponse<Budget>> = await this.api.put(`/budgets/${id}`, budget);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update budget'
      };
    }
  }

  async deleteBudget(id: number): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/budgets/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete budget'
      };
    }
  }

  async approveBudget(id: number): Promise<ApiResponse<Budget>> {
    try {
      const response: AxiosResponse<ApiResponse<Budget>> = await this.api.post(`/budgets/${id}/approve`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to approve budget'
      };
    }
  }

  async rejectBudget(id: number): Promise<ApiResponse<Budget>> {
    try {
      const response: AxiosResponse<ApiResponse<Budget>> = await this.api.post(`/budgets/${id}/reject`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to reject budget'
      };
    }
  }
}

export default new ApiService();
