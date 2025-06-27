import { userApi } from './api';
import type { User, CreateUserRequest, UpdateUserRequest, UserStats } from '../types/user';

export class UserService {
  // 获取所有用户
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await userApi.getAll();
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }
  // 根据id获取用户
  static async getUserById(id: number): Promise<User> {
    try {
      const response = await userApi.getById(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching user by id:', error);
      throw error;
    }
  } 

  // 创建用户
  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await userApi.create(userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // 更新用户
  static async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    try {
      const response = await userApi.update(id, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // 删除用户
  static async deleteUser(id: number): Promise<void> {
    try {
      await userApi.delete(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // 获取用户统计信息
  static async getUserStats(): Promise<UserStats> {
    try {
      const response = await userApi.getStats();
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  // 重置用户密码
  static async resetUserPassword(id: number, password: string): Promise<void> {
    try {
      await userApi.resetPassword(id, { password });
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
  }
} 