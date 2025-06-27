import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getDatabase } from '../database/init';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DateUtils } from '../utils/dateUtils';

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
  productivityLevel: number; // 0-100
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

export class AIAnalysisService {
  private static llm: ChatOpenAI;

  private static initializeLLM() {
    if (!this.llm) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }
      
      this.llm = new ChatOpenAI({
        modelName: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 2000,
      });
    }
    return this.llm;
  }

  // 获取用户的任务数据
  private static async getUserTaskData(userId: number, days: number = 30): Promise<any[]> {
    const db = getDatabase();
    
    const startDate = DateUtils.formatToDateString(DateUtils.getCurrentLocalTime());
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.due_date,
          t.created_at,
          t.updated_at,
          t.completed_at,
          p.name as project_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.user_id = ? 
        AND DATE(t.created_at) >= DATE('now', '-${days} days')
        ORDER BY t.created_at DESC
      `;
      
      db.all(query, [userId], (err, tasks) => {
        if (err) {
          reject(err);
        } else {
          resolve(tasks);
        }
      });
    });
  }

  // 分析任务数据
  private static analyzeTaskData(tasks: any[]): TaskAnalysis {
    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const overdueTasks = tasks.filter(t => 
      t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
    ).length;

    // 计算平均完成时间
    const completedTasksWithTime = tasks.filter(t => 
      t.status === 'completed' && t.completed_at && t.created_at
    );
    
    let averageCompletionTime = 0;
    if (completedTasksWithTime.length > 0) {
      const totalTime = completedTasksWithTime.reduce((sum, task) => {
        const created = new Date(task.created_at);
        const completed = new Date(task.completed_at);
        return sum + (completed.getTime() - created.getTime());
      }, 0);
      averageCompletionTime = totalTime / completedTasksWithTime.length / (1000 * 60 * 60 * 24); // 转换为天
    }

    // 计算生产力分数
    const productivityScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // 获取高优先级任务
    const topPriorities = tasks
      .filter(t => t.priority === 'high' && t.status !== 'completed')
      .slice(0, 5)
      .map(t => t.title);

    // 分析最近趋势
    const recentTrends = this.analyzeRecentTrends(tasks);

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      averageCompletionTime,
      productivityScore,
      topPriorities,
      recentTrends
    };
  }

  // 分析最近趋势
  private static analyzeRecentTrends(tasks: any[]): string[] {
    const trends: string[] = [];
    const now = new Date();
    const lastWeek = subDays(now, 7);
    const lastMonth = subDays(now, 30);

    // 最近一周的任务完成情况
    const lastWeekTasks = tasks.filter(t => 
      new Date(t.created_at) >= lastWeek
    );
    const lastWeekCompleted = lastWeekTasks.filter(t => t.status === 'completed').length;
    
    if (lastWeekTasks.length > 0) {
      const completionRate = (lastWeekCompleted / lastWeekTasks.length) * 100;
      if (completionRate > 80) {
        trends.push('最近一周任务完成率很高，工作效率良好');
      } else if (completionRate > 60) {
        trends.push('最近一周任务完成率中等，需要关注时间管理');
      } else {
        trends.push('最近一周任务完成率较低，建议重新评估任务优先级');
      }
    }

    // 逾期任务趋势
    const overdueTasks = tasks.filter(t => 
      t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
    );
    if (overdueTasks.length > 0) {
      trends.push(`有${overdueTasks.length}个任务逾期，建议优先处理`);
    }

    // 高优先级任务趋势
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    if (highPriorityTasks.length > 0) {
      const highPriorityCompleted = highPriorityTasks.filter(t => t.status === 'completed').length;
      if (highPriorityCompleted / highPriorityTasks.length < 0.7) {
        trends.push('高优先级任务完成率较低，建议重新规划时间');
      }
    }

    return trends;
  }

  // 生成AI分析报告
  public static async generateWorkStatusAnalysis(userId: number): Promise<WorkStatusAnalysis> {
    try {
      const llm = this.initializeLLM();
      
      // 获取用户任务数据
      const tasks = await this.getUserTaskData(userId);
      const taskAnalysis = this.analyzeTaskData(tasks);

      // 构建分析提示
      const analysisPrompt = this.buildAnalysisPrompt(taskAnalysis, tasks);
      
      // 调用AI进行分析
      const response = await llm.invoke([
        new SystemMessage(`你是一个专业的工作效率分析师。请根据提供的任务数据，分析用户的工作状态并提供具体的改进建议。
        
        请以JSON格式返回分析结果，包含以下字段：
        {
          "overallStatus": "excellent|good|fair|needs_improvement",
          "productivityLevel": 0-100,
          "strengths": ["优势1", "优势2"],
          "weaknesses": ["需要改进的地方1", "需要改进的地方2"],
          "recommendations": ["建议1", "建议2", "建议3"],
          "timeManagement": {
            "score": 0-100,
            "insights": ["时间管理洞察1", "时间管理洞察2"]
          },
          "priorityManagement": {
            "score": 0-100,
            "insights": ["优先级管理洞察1", "优先级管理洞察2"]
          },
          "workLifeBalance": {
            "score": 0-100,
            "insights": ["工作生活平衡洞察1", "工作生活平衡洞察2"]
          }
        }
        
        请确保返回的是有效的JSON格式。`),
        new HumanMessage(analysisPrompt)
      ]);

      // 解析AI响应
      const aiResponse = response.content as string;
      const analysisResult = JSON.parse(aiResponse);

      return analysisResult as WorkStatusAnalysis;
    } catch (error) {
      console.error('AI分析失败:', error);
      throw new Error('AI分析服务暂时不可用');
    }
  }

  // 构建分析提示
  private static buildAnalysisPrompt(taskAnalysis: TaskAnalysis, tasks: any[]): string {
    const taskDetails = tasks.slice(0, 20).map(task => ({
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      createdAt: task.created_at,
      completedAt: task.completed_at,
      project: task.project_name
    }));

    return `
请分析以下用户的工作状态数据：

任务统计：
- 总任务数：${taskAnalysis.totalTasks}
- 已完成任务：${taskAnalysis.completedTasks}
- 待处理任务：${taskAnalysis.pendingTasks}
- 逾期任务：${taskAnalysis.overdueTasks}
- 平均完成时间：${taskAnalysis.averageCompletionTime.toFixed(1)}天
- 生产力分数：${taskAnalysis.productivityScore.toFixed(1)}%

高优先级任务：
${taskAnalysis.topPriorities.map(task => `- ${task}`).join('\n')}

最近趋势：
${taskAnalysis.recentTrends.map(trend => `- ${trend}`).join('\n')}

最近任务详情（前20个）：
${JSON.stringify(taskDetails, null, 2)}

请基于这些数据提供详细的工作状态分析和改进建议。
    `;
  }

  // 获取任务趋势图表数据
  public static async getTaskTrends(userId: number, days: number = 30) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
        FROM tasks 
        WHERE user_id = ? AND DATE(created_at) >= DATE('now', '-${days} days')
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
      
      db.all(query, [userId], (err, trends) => {
        if (err) {
          reject(err);
        } else {
          resolve(trends);
        }
      });
    });
  }
} 