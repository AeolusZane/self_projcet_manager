import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import type { Task, Project } from '../../types';
import { TaskService } from '../../services/taskService';
import { ProjectService } from '../../services/projectService';

const Charts: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        TaskService.getAllTasks(),
        ProjectService.getAllProjects()
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算统计数据
  const getStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    
    const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;
    const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium').length;
    const lowPriorityTasks = tasks.filter(t => t.priority === 'low').length;

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      totalProjects,
      activeProjects,
      completedProjects,
      completionRate
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总任务数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">已完成</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">进行中</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgressTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">待处理</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 任务状态分布 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">任务状态分布</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">已完成</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{stats.completedTasks}</span>
                <span className="text-sm text-gray-500">({stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">进行中</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{stats.inProgressTasks}</span>
                <span className="text-sm text-gray-500">({stats.totalTasks > 0 ? Math.round((stats.inProgressTasks / stats.totalTasks) * 100) : 0}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${stats.totalTasks > 0 ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600">待处理</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{stats.pendingTasks}</span>
                <span className="text-sm text-gray-500">({stats.totalTasks > 0 ? Math.round((stats.pendingTasks / stats.totalTasks) * 100) : 0}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gray-500 h-2 rounded-full" 
                style={{ width: `${stats.totalTasks > 0 ? (stats.pendingTasks / stats.totalTasks) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 任务优先级分布 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">任务优先级分布</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">高优先级</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{stats.highPriorityTasks}</span>
                <span className="text-sm text-gray-500">({stats.totalTasks > 0 ? Math.round((stats.highPriorityTasks / stats.totalTasks) * 100) : 0}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${stats.totalTasks > 0 ? (stats.highPriorityTasks / stats.totalTasks) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">中优先级</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{stats.mediumPriorityTasks}</span>
                <span className="text-sm text-gray-500">({stats.totalTasks > 0 ? Math.round((stats.mediumPriorityTasks / stats.totalTasks) * 100) : 0}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${stats.totalTasks > 0 ? (stats.mediumPriorityTasks / stats.totalTasks) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">低优先级</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{stats.lowPriorityTasks}</span>
                <span className="text-sm text-gray-500">({stats.totalTasks > 0 ? Math.round((stats.lowPriorityTasks / stats.totalTasks) * 100) : 0}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${stats.totalTasks > 0 ? (stats.lowPriorityTasks / stats.totalTasks) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 项目统计 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">项目统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalProjects}</div>
            <div className="text-sm text-gray-600">总项目数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.activeProjects}</div>
            <div className="text-sm text-gray-600">活跃项目</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">{stats.completedProjects}</div>
            <div className="text-sm text-gray-600">已完成项目</div>
          </div>
        </div>
      </div>

      {/* 完成率 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">任务完成率</h3>
          <div className="relative group">
            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center cursor-help">
              <span className="text-xs text-gray-600">?</span>
            </div>
            <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              <div className="font-medium mb-1">完成率计算公式：</div>
              <div>完成率 = (已完成任务数 ÷ 总任务数) × 100%</div>
              <div className="mt-1 text-gray-300">
                当前：({stats.completedTasks} ÷ {stats.totalTasks}) × 100% = {stats.completionRate}%
              </div>
              <div className="mt-2 text-gray-300">
                • 已完成：状态为"已完成"的任务
                <br />
                • 总任务：所有状态的任务总数
              </div>
              <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center">
              <div className="text-2xl font-bold text-gray-900">{stats.completionRate}%</div>
            </div>
            <div 
              className="absolute inset-0 w-32 h-32 rounded-full border-8 border-blue-500"
              style={{
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + (stats.completionRate * 3.6)}% 0%, ${50 + (stats.completionRate * 3.6)}% 50%)`
              }}
            ></div>
          </div>
        </div>
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            已完成 {stats.completedTasks} 个任务，共 {stats.totalTasks} 个任务
          </p>
        </div>
      </div>
    </div>
  );
};

export default Charts; 