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

  // Protocol Management
  async getProtocols(query?: { status?: string; createdBy?: string }): Promise<any[]> {
    const params = query || {};
    const response = await this.client.get<ApiResponse>('/api/protocols', { params });
    return response.data.data || [];
  }

  async getProtocol(id: string): Promise<any> {
    const response = await this.client.get<ApiResponse>(`/api/protocols/${id}`);
    return response.data.data;
  }

  async getProtocolWithSteps(id: string): Promise<any> {
    const response = await this.client.get<ApiResponse>(`/api/protocols/${id}/with-steps`);
    return response.data.data;
  }

  async createProtocol(data: { name: string; description?: string }): Promise<any> {
    const response = await this.client.post<ApiResponse>('/api/protocols', data);
    return response.data.data;
  }

  async updateProtocol(id: string, data: { name?: string; description?: string; status?: string }): Promise<any> {
    const response = await this.client.put<ApiResponse>(`/api/protocols/${id}`, data);
    return response.data.data;
  }

  async updateProtocolWithSteps(id: string, data: { 
    name?: string; 
    description?: string; 
    status?: string;
    steps?: any[];
  }): Promise<any> {
    // First update the protocol basic info
    const { steps, ...protocolData } = data;
    if (Object.keys(protocolData).length > 0) {
      await this.updateProtocol(id, protocolData);
    }

    // If steps are provided, update them
    if (steps && steps.length > 0) {
      // Get current steps to determine which to update/delete/create
      const currentSteps = await this.getProtocolSteps(id);
      
      // Delete all existing steps first (simpler approach)
      for (const step of currentSteps) {
        await this.deleteProtocolStep(id, step.id);
      }
      
      // Create new steps
      for (const step of steps) {
        await this.createProtocolStep(id, step);
      }
    }

    // Return the updated protocol with steps
    return await this.getProtocolWithSteps(id);
  }

  async deleteProtocol(id: string): Promise<void> {
    await this.client.delete(`/api/protocols/${id}`);
  }

  async activateProtocol(id: string): Promise<any> {
    const response = await this.client.post<ApiResponse>(`/api/protocols/${id}/activate`);
    return response.data.data;
  }

  async validateProtocol(id: string): Promise<{ isValid: boolean; errors: string[] }> {
    const response = await this.client.get<ApiResponse>(`/api/protocols/${id}/validate`);
    return response.data.data;
  }

  // Protocol Steps
  async getProtocolSteps(protocolId: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse>(`/api/protocols/${protocolId}/steps`);
    return response.data.data || [];
  }

  async createProtocolStep(protocolId: string, data: any): Promise<any> {
    const response = await this.client.post<ApiResponse>(`/api/protocols/${protocolId}/steps`, data);
    return response.data.data;
  }

  async updateProtocolStep(protocolId: string, stepId: string, data: any): Promise<any> {
    const response = await this.client.put<ApiResponse>(`/api/protocols/${protocolId}/steps/${stepId}`, data);
    return response.data.data;
  }

  async deleteProtocolStep(protocolId: string, stepId: string): Promise<void> {
    await this.client.delete(`/api/protocols/${protocolId}/steps/${stepId}`);
  }

  // Research & Analytics
  async getDashboardMetrics(): Promise<any> {
    const response = await this.client.get<ApiResponse>('/api/research/metrics');
    return response.data.data;
  }

  async getAdherenceMetrics(protocolId: string): Promise<any> {
    const response = await this.client.get<ApiResponse>(`/api/research/adherence/${protocolId}`);
    return response.data.data;
  }

  async getPatientList(): Promise<any[]> {
    const response = await this.client.get<ApiResponse>('/api/research/patients');
    return response.data.data || [];
  }

  async exportResearchData(query: any): Promise<any[]> {
    const response = await this.client.get<ApiResponse>('/api/research/export', { params: query });
    return response.data.data || [];
  }

  async exportResearchDataCSV(query: any): Promise<string> {
    const response = await this.client.post('/api/research/export', { ...query, format: 'csv' }, {
      headers: { 'Accept': 'text/csv' }
    });
    return response.data;
  }

  // Protocol Assignments
  async getProtocolAssignments(filter?: {
    status?: 'assigned' | 'active' | 'completed' | 'paused';
    userId?: string;
    protocolId?: string;
  }): Promise<any[]> {
    const params = filter || {};
    const response = await this.client.get<ApiResponse>('/api/protocol-assignments', { params });
    return response.data.data || [];
  }

  async getProtocolAssignmentsByProtocol(protocolId: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse>(`/api/protocol-assignments/protocol/${protocolId}`);
    return response.data.data || [];
  }

  async getProtocolAssignmentsByUser(userId: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse>(`/api/protocol-assignments/user/${userId}`);
    return response.data.data || [];
  }

  async createProtocolAssignment(data: { userId: string; protocolId: string }): Promise<any> {
    const response = await this.client.post<ApiResponse>('/api/protocol-assignments', data);
    return response.data.data;
  }

  async startProtocolAssignment(assignmentId: string): Promise<any> {
    const response = await this.client.post<ApiResponse>(`/api/protocol-assignments/${assignmentId}/start`);
    return response.data.data;
  }

  async pauseProtocolAssignment(assignmentId: string): Promise<any> {
    const response = await this.client.post<ApiResponse>(`/api/protocol-assignments/${assignmentId}/pause`);
    return response.data.data;
  }

  async resumeProtocolAssignment(assignmentId: string): Promise<any> {
    const response = await this.client.post<ApiResponse>(`/api/protocol-assignments/${assignmentId}/resume`);
    return response.data.data;
  }

  async completeProtocolAssignment(assignmentId: string): Promise<any> {
    const response = await this.client.post<ApiResponse>(`/api/protocol-assignments/${assignmentId}/complete`);
    return response.data.data;
  }

  async deleteProtocolAssignment(assignmentId: string): Promise<void> {
    await this.client.delete(`/api/protocol-assignments/${assignmentId}`);
  }

  async getProtocolAssignmentStats(): Promise<{
    total: number;
    assigned: number;
    active: number;
    completed: number;
    paused: number;
    averageAdherenceRate: number;
  }> {
    const response = await this.client.get<ApiResponse>('/api/protocol-assignments/stats/overview');
    return response.data.data;
  }

  // Generic HTTP methods for flexibility
  async get(url: string, params?: any): Promise<any> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post(url: string, data?: any): Promise<any> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put(url: string, data?: any): Promise<any> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  async delete(url: string): Promise<any> {
    const response = await this.client.delete(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();