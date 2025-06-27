import axios from 'axios';
import type { Task, Project, ApiResponse, User, CreateUserRequest, UpdateUserRequest, UserStats } from '../types';
import { AuthService } from './authService';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理token过期
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      AuthService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 任务相关 API
export const taskApi = {
  // 获取所有任务（支持筛选）
  getAll: (filters?: {
    status?: string;
    priority?: string;
    project_id?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
    }
    return api.get<Task[]>(`/tasks?${params.toString()}`);
  },
  
  // 获取筛选后的任务数量
  getFilteredCount: (filters?: {
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
    }
    return api.get<{ count: number }>(`/tasks/filtered-count?${params.toString()}`);
  },

  // 导出任务数据
  export: (filters?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    format?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
    }
    return api.get(`/tasks/export?${params.toString()}`);
  },
  
  // 获取单个任务
  getById: (id: number) => api.get<Task>(`/tasks/${id}`),
  
  // 创建新任务
  create: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_name'>) => api.post<Task>('/tasks', task),
  
  // 更新任务
  update: (id: number, task: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_name'>>) => 
    api.put(`/tasks/${id}`, task),
  
  // 删除任务
  delete: (id: number) => api.delete(`/tasks/${id}`),
};

// 项目相关 API
export const projectApi = {
  // 获取所有项目
  getAll: () => api.get<Project[]>('/projects'),
  
  // 获取单个项目
  getById: (id: number) => api.get<Project>(`/projects/${id}`),
  
  // 创建新项目
  create: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => api.post<Project>('/projects', project),
  
  // 更新项目
  update: (id: number, project: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>) => 
    api.put(`/projects/${id}`, project),
  
  // 删除项目
  delete: (id: number) => api.delete(`/projects/${id}`),
};

// 健康检查 API
export const healthApi = {
  check: () => api.get<{ status: string; timestamp: string }>('/health'),
};

// 认证相关API
export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
};

// 用户相关API
export const userApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: CreateUserRequest) => api.post<User>('/users', data),
  update: (id: number, data: UpdateUserRequest) => api.put<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  getStats: () => api.get<UserStats>('/users/stats'),
  resetPassword: (id: number, data: { password: string }) => api.post(`/users/${id}/reset-password`, data),
};

export default api; 