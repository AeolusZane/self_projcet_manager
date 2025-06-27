import api from './api';

export interface TaskAnalysis {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  productivityScore: number;
  topPriorities: string[];
  recentTrends: string[];
}

export interface WorkStatusAnalysis {
  overallStatus: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  productivityLevel: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  timeManagement: {
    score: number;
    insights: string[];
  };
  priorityManagement: {
    score: number;
    insights: string[];
  };
  workLifeBalance: {
    score: number;
    insights: string[];
  };
}

export interface TaskTrend {
  date: string;
  total: number;
  completed: number;
  pending: number;
  in_progress: number;
}

export class AIAnalysisService {
  // 获取工作状态AI分析
  static async getWorkStatusAnalysis(): Promise<WorkStatusAnalysis> {
    try {
      const response = await api.get('/ai-analysis/work-status');
      return response.data.data;
    } catch (error) {
      console.error('获取AI分析失败:', error);
      throw error;
    }
  }

  // 获取任务趋势数据
  static async getTaskTrends(days: number = 30): Promise<TaskTrend[]> {
    try {
      const response = await api.get(`/ai-analysis/task-trends?days=${days}`);
      return response.data.data;
    } catch (error) {
      console.error('获取任务趋势失败:', error);
      throw error;
    }
  }

  // 获取任务统计摘要
  static async getTaskSummary(): Promise<TaskAnalysis> {
    try {
      const response = await api.get('/ai-analysis/task-summary');
      return response.data.data;
    } catch (error) {
      console.error('获取任务摘要失败:', error);
      throw error;
    }
  }
} 