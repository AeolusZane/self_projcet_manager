import { projectApi } from './api';
import type { Project } from '../types';

// 后台服务基础URL
const BACKEND_BASE_URL = 'http://localhost:3001';

export class ProjectService {
  // 获取所有项目
  static async getAllProjects(): Promise<Project[]> {
    try {
      const response = await projectApi.getAll();
      return response.data;
    } catch (error) {
      console.error('获取项目列表失败:', error);
      throw error;
    }
  }

  // 获取单个项目
  static async getProjectById(id: number): Promise<Project> {
    try {
      const response = await projectApi.getById(id);
      return response.data;
    } catch (error) {
      console.error(`获取项目 ${id} 失败:`, error);
      throw error;
    }
  }

  // 创建新项目
  static async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    try {
      const response = await projectApi.create(projectData);
      return response.data;
    } catch (error) {
      console.error('创建项目失败:', error);
      throw error;
    }
  }

  // 更新项目
  static async updateProject(id: number, projectData: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    try {
      await projectApi.update(id, projectData);
    } catch (error) {
      console.error(`更新项目 ${id} 失败:`, error);
      throw error;
    }
  }

  // 删除项目
  static async deleteProject(id: number): Promise<void> {
    try {
      await projectApi.delete(id);
    } catch (error) {
      console.error(`删除项目 ${id} 失败:`, error);
      throw error;
    }
  }

  // 根据状态过滤项目
  static async getProjectsByStatus(status: Project['status']): Promise<Project[]> {
    const allProjects = await this.getAllProjects();
    return allProjects.filter(project => project.status === status);
  }

  // 获取活跃项目
  static async getActiveProjects(): Promise<Project[]> {
    return this.getProjectsByStatus('active');
  }

  // 获取已完成项目
  static async getCompletedProjects(): Promise<Project[]> {
    return this.getProjectsByStatus('completed');
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
} 