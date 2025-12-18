/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosError } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  }

  private clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  }

  async login(email: string, password: string): Promise<{ admin: any; token: string }> {
    const response = await this.client.post<ApiResponse<{ admin: any; token: string }>>(
      '/api/auth/login',
      { email, password }
    );
    
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      return response.data.data;
    }
    
    throw new Error('Login failed');
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/api/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  async getCurrentAdmin(): Promise<any> {
    const response = await this.client.get<ApiResponse>('/api/auth/me');
    return response.data.data;
  }

  async getUsers(status?: 'active' | 'inactive'): Promise<any[]> {
    const params = status ? { status } : {};
    const response = await this.client.get<ApiResponse>('/api/users', { params });
    return response.data.data || [];
  }

  async getUserStats(): Promise<{ totalUsers: number; activeUsers: number; inactiveUsers: number }> {
    const response = await this.client.get<ApiResponse>('/api/users/stats');
    return response.data.data;
  }

  async updateUserStatus(userId: string, status: 'active' | 'inactive'): Promise<any> {
    const response = await this.client.put<ApiResponse>(`/api/users/${userId}/status`, { status });
    return response.data.data;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const apiClient = new ApiClient();