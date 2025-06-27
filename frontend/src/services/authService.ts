import { authApi } from './api';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

export class AuthService {
  // 登录
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await authApi.login(credentials);
      // 保存token到localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  // 注册
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await authApi.register(userData);
      // 保存token到localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  }

  // 登出
  static async logout(): Promise<void> {
    try {
      // 调用后台退出登录接口
      await authApi.logout();
    } catch (error) {
      console.error('调用退出登录接口失败:', error);
      // 即使后台调用失败，也要清除本地存储
    } finally {
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // 获取当前用户
  static getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // 获取token
  static getToken(): string | null {
    return localStorage.getItem('token');
  }

  // 检查是否已登录
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    
    // 检查token是否过期（JWT token包含过期时间）
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        // Token已过期，清除本地存储
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      // Token格式无效，清除本地存储
      this.logout();
      return false;
    }
  }

  // 验证token有效性（可选：向服务器验证）
  static async validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      // 这里可以添加一个API调用来验证token
      // const response = await authApi.validateToken();
      // return response.data.valid;
      
      // 暂时使用本地验证
      return this.isAuthenticated();
    } catch (error) {
      this.logout();
      return false;
    }
  }
} 