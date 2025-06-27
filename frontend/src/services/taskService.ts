import { taskApi } from './api';
import type { Task } from '../types';
import { useAlert } from '../components/Alert';

// 后台服务基础URL
const BACKEND_BASE_URL = 'http://localhost:3001';

export class TaskService {
  // 获取所有任务（支持筛选）
  static async getAllTasks(filters?: {
    status?: string;
    priority?: string;
    project_id?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  }): Promise<Task[]> {
    try {
      const response = await taskApi.getAll(filters);
      return response.data;
    } catch (error) {
      console.error('获取任务列表失败:', error);
      throw error;
    }
  }

  // 获取筛选后的任务数量
  static async getFilteredCount(filters?: {
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<number> {
    try {
      const response = await taskApi.getFilteredCount(filters);
      return response.data.count;
    } catch (error) {
      console.error('获取筛选后的任务数量失败:', error);
      throw error;
    }
  }

  // 获取单个任务
  static async getTaskById(id: number): Promise<Task> {
    try {
      const response = await taskApi.getById(id);
      return response.data;
    } catch (error) {
      console.error(`获取任务 ${id} 失败:`, error);
      throw error;
    }
  }

  // 创建新任务
  static async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_name'>): Promise<Task> {
    try {
      const response = await taskApi.create(taskData);
      return response.data;
    } catch (error) {
      console.error('创建任务失败:', error);
      throw error;
    }
  }

  // 更新任务
  static async updateTask(id: number, taskData: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_name'>>): Promise<void> {
    try {
      await taskApi.update(id, taskData);
    } catch (error) {
      console.error(`更新任务 ${id} 失败:`, error);
      throw error;
    }
  }

  // 删除任务
  static async deleteTask(id: number): Promise<void> {
    try {
      await taskApi.delete(id);
    } catch (error) {
      console.error(`删除任务 ${id} 失败:`, error);
      throw error;
    }
  }

  // 根据状态过滤任务
  static async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.status === status);
  }

  // 根据优先级过滤任务
  static async getTasksByPriority(priority: Task['priority']): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.priority === priority);
  }

  // 根据项目过滤任务
  static async getTasksByProject(projectId: number): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.project_id === projectId);
  }

  // 根据创建日期过滤任务
  static async getTasksByCreatedDate(date: string): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.created_at === date);
  }

  // 获取指定日期范围内的任务
  static async getTasksByDateRange(startDate: string, endDate: string): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => {
      if (!task.created_at) return false;
      return task.created_at >= startDate && task.created_at <= endDate;
    });
  }

  // 获取任务导出数据格式
  static async getTaskExportFormat(taskIds: number[], filters?: {
    status?: string;
    priority?: string;
    project_id?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  }): Promise<{
    data: any[];
    total: number;
    columnWidths: any[];
    filters: any;
  }> {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/tasks/export-format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskIds,
          filters
        })
      });

      if (!response.ok) {
        throw new Error('获取任务导出数据格式失败');
      }

      return await response.json();
    } catch (error) {
      console.error('获取任务导出数据格式失败:', error);
      throw error;
    }
  }

  // 获取项目导出数据格式
  static async getProjectExportFormat(projectIds: number[]): Promise<{
    data: any[];
    total: number;
    columnWidths: any[];
  }> {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/tasks/projects/export-format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectIds
        })
      });

      if (!response.ok) {
        throw new Error('获取项目导出数据格式失败');
      }

      return await response.json();
    } catch (error) {
      console.error('获取项目导出数据格式失败:', error);
      throw error;
    }
  }

  // 导出任务数据（支持筛选）
  static async exportTasks(filters?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    format?: 'excel' | 'csv';
  }): Promise<{
    data: any[];
    total: number;
    filters: any;
  }> {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/tasks/export?${new URLSearchParams(filters as any)}`);
      
      if (!response.ok) {
        throw new Error('导出任务失败');
      }

      return await response.json();
    } catch (error) {
      console.error('导出任务失败:', error);
      throw error;
    }
  }
} 