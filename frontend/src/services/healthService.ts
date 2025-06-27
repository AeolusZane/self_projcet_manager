import { healthApi } from './api';

export class HealthService {
  // 检查服务健康状态
  static async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await healthApi.check();
      return response.data;
    } catch (error) {
      console.error('健康检查失败:', error);
      throw error;
    }
  }

  // 检查服务是否可用
  static async isServiceAvailable(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch (error) {
      return false;
    }
  }
} 