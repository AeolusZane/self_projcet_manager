import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, BarChart3, Activity, BarChart, LineChart, CalendarDays, FolderOpen, Users } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { Task, Project } from '../../types';
import { TaskService } from '../../services/taskService';
import { ProjectService } from '../../services/projectService';

const Trends: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  
  // 自定义时间范围
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // 设置默认自定义日期范围（最近30天）
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setCustomEndDate(today.toISOString().split('T')[0]);
    setCustomStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        TaskService.getAllTasks(),
        ProjectService.getAllProjects()
      ]);
      console.log('趋势页拿到的任务数据:', tasksData);
      console.log('趋势页拿到的项目数据:', projectsData);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 生成时间范围数据
  const generateTimeData = () => {
    const now = new Date();
    const data = [];
    
    let startDate: Date;
    let endDate: Date;
    
    if (timeRange === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      endDate = now;
      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      data.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('zh-CN', { 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    
    return data;
  };

  // 计算每日任务完成数
  const getDailyTaskCompletion = () => {
    const timeData = generateTimeData();
    const completionData = timeData.map(item => {
      const completedTasks = tasks.filter(task => {
        if (task.status !== 'completed' || !task.updated_at) return false;
        const taskDate = new Date(task.updated_at).toISOString().split('T')[0];
        return taskDate === item.date;
      }).length;
      
      return {
        ...item,
        completed: completedTasks
      };
    });

    return completionData;
  };

  // 计算每日新增任务数
  const getDailyNewTasks = () => {
    const timeData = generateTimeData();
    const newTaskData = timeData.map(item => {
      const newTasks = tasks.filter(task => {
        if (!task.created_at) return false;
        return task.created_at === item.date;
      }).length;
      
      return {
        ...item,
        new: newTasks
      };
    });

    return newTaskData;
  };

  // 计算每日新增项目数
  const getDailyNewProjects = () => {
    const timeData = generateTimeData();
    const newProjectData = timeData.map(item => {
      const newProjects = projects.filter(project => {
        if (!project.created_at) return false;
        const projectDate = new Date(project.created_at).toISOString().split('T')[0];
        return projectDate === item.date;
      }).length;
      
      return {
        ...item,
        new: newProjects
      };
    });

    return newProjectData;
  };

  // 计算任务状态趋势
  const getTaskStatusTrend = () => {
    const timeData = generateTimeData();
    const statusData = timeData.map(item => {
      const pendingTasks = tasks.filter(task => {
        if (task.status !== 'pending') return false;
        const taskDate = task.created_at || new Date(task.created_at).toISOString().split('T')[0];
        return taskDate <= item.date;
      }).length;

      const inProgressTasks = tasks.filter(task => {
        if (task.status !== 'in_progress') return false;
        const taskDate = task.created_at || new Date(task.created_at).toISOString().split('T')[0];
        return taskDate <= item.date;
      }).length;

      const completedTasks = tasks.filter(task => {
        if (task.status !== 'completed') return false;
        const taskDate = task.created_at || new Date(task.updated_at).toISOString().split('T')[0];
        return taskDate <= item.date;
      }).length;
      
      return {
        ...item,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks
      };
    });

    return statusData;
  };

  // 计算项目状态趋势
  const getProjectStatusTrend = () => {
    const timeData = generateTimeData();
    const statusData = timeData.map(item => {
      const activeProjects = projects.filter(project => {
        if (project.status !== 'active') return false;
        const projectDate = new Date(project.created_at).toISOString().split('T')[0];
        return projectDate <= item.date;
      }).length;

      const completedProjects = projects.filter(project => {
        if (project.status !== 'completed') return false;
        const projectDate = new Date(project.updated_at).toISOString().split('T')[0];
        return projectDate <= item.date;
      }).length;

      const archivedProjects = projects.filter(project => {
        if (project.status !== 'archived') return false;
        const projectDate = new Date(project.updated_at).toISOString().split('T')[0];
        return projectDate <= item.date;
      }).length;
      
      return {
        ...item,
        active: activeProjects,
        completed: completedProjects,
        archived: archivedProjects
      };
    });

    return statusData;
  };

  // 计算统计数据
  const getTrendStats = () => {
    const completionData = getDailyTaskCompletion();
    const newTaskData = getDailyNewTasks();
    const newProjectData = getDailyNewProjects();
    
    const totalCompleted = completionData.reduce((sum, item) => sum + item.completed, 0);
    const totalNewTasks = newTaskData.reduce((sum, item) => sum + item.new, 0);
    const totalNewProjects = newProjectData.reduce((sum, item) => sum + item.new, 0);
    const avgDailyCompletion = completionData.length > 0 ? Math.round(totalCompleted / completionData.length) : 0;
    const avgDailyNewTasks = newTaskData.length > 0 ? Math.round(totalNewTasks / newTaskData.length) : 0;
    const avgDailyNewProjects = newProjectData.length > 0 ? Math.round(totalNewProjects / newProjectData.length) : 0;
    
    const completionRate = totalNewTasks > 0 ? Math.round((totalCompleted / totalNewTasks) * 100) : 0;
    
    return {
      totalCompleted,
      totalNewTasks,
      totalNewProjects,
      avgDailyCompletion,
      avgDailyNewTasks,
      avgDailyNewProjects,
      completionRate
    };
  };

  // 处理时间范围变化
  const handleTimeRangeChange = (newTimeRange: typeof timeRange) => {
    setTimeRange(newTimeRange);
    if (newTimeRange === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
    }
  };

  // 应用自定义日期范围
  const applyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      setTimeRange('custom');
      setShowCustomDatePicker(false);
    }
  };

  // 获取时间范围文本
  const getTimeRangeText = () => {
    switch (timeRange) {
      case 'week':
        return '最近7天';
      case 'month':
        return '最近30天';
      case 'quarter':
        return '最近90天';
      case 'year':
        return '最近一年';
      case 'custom':
        return `${customStartDate} 至 ${customEndDate}`;
      default:
        return '最近30天';
    }
  };

  // 任务完成趋势图表配置
  const getCompletionChartOption = () => {
    const data = getDailyTaskCompletion();
    const labels = data.map(item => item.label);
    const completedData = data.map(item => item.completed);

    return {
      title: {
        text: '任务完成趋势',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>完成数量: {c}'
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '完成数量'
      },
      series: [
        {
          name: '完成任务',
          type: chartType,
          data: completedData,
          itemStyle: { color: '#10B981' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }
              ]
            }
          }
        }
      ]
    };
  };

  // 新增任务趋势图表配置
  const getNewTasksChartOption = () => {
    const data = getDailyNewTasks();
    const labels = data.map(item => item.label);
    const newData = data.map(item => item.new);

    return {
      title: {
        text: '新增任务趋势',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>新增数量: {c}'
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '新增数量'
      },
      series: [
        {
          name: '新增任务',
          type: chartType,
          data: newData,
          itemStyle: { color: '#3B82F6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.1)' }
              ]
            }
          }
        }
      ]
    };
  };

  // 新增项目趋势图表配置
  const getNewProjectsChartOption = () => {
    const data = getDailyNewProjects();
    const labels = data.map(item => item.label);
    const newData = data.map(item => item.new);

    return {
      title: {
        text: '新增项目趋势',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>新增数量: {c}'
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '新增数量'
      },
      series: [
        {
          name: '新增项目',
          type: chartType,
          data: newData,
          itemStyle: { color: '#8B5CF6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
                { offset: 1, color: 'rgba(139, 92, 246, 0.1)' }
              ]
            }
          }
        }
      ]
    };
  };

  // 任务状态趋势图表配置
  const getTaskStatusTrendChartOption = () => {
    const data = getTaskStatusTrend();
    const labels = data.map(item => item.label);
    const pendingData = data.map(item => item.pending);
    const inProgressData = data.map(item => item.inProgress);
    const completedData = data.map(item => item.completed);

    return {
      title: {
        text: '任务状态趋势',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        legend: {
          data: ['待处理', '进行中', '已完成']
        }
      },
      legend: {
        data: ['待处理', '进行中', '已完成'],
        top: 30
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '任务数量'
      },
      series: [
        {
          name: '待处理',
          type: chartType,
          data: pendingData,
          itemStyle: { color: '#F59E0B' }
        },
        {
          name: '进行中',
          type: chartType,
          data: inProgressData,
          itemStyle: { color: '#3B82F6' }
        },
        {
          name: '已完成',
          type: chartType,
          data: completedData,
          itemStyle: { color: '#10B981' }
        }
      ]
    };
  };

  // 项目状态趋势图表配置
  const getProjectStatusTrendChartOption = () => {
    const data = getProjectStatusTrend();
    const labels = data.map(item => item.label);
    const activeData = data.map(item => item.active);
    const completedData = data.map(item => item.completed);
    const archivedData = data.map(item => item.archived);

    return {
      title: {
        text: '项目状态趋势',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        legend: {
          data: ['活跃', '已完成', '已归档']
        }
      },
      legend: {
        data: ['活跃', '已完成', '已归档'],
        top: 30
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '项目数量'
      },
      series: [
        {
          name: '活跃',
          type: chartType,
          data: activeData,
          itemStyle: { color: '#10B981' }
        },
        {
          name: '已完成',
          type: chartType,
          data: completedData,
          itemStyle: { color: '#3B82F6' }
        },
        {
          name: '已归档',
          type: chartType,
          data: archivedData,
          itemStyle: { color: '#6B7280' }
        }
      ]
    };
  };

  const stats = getTrendStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">趋势分析</h2>
        <div className="flex items-center space-x-4">
          {/* 图表类型切换 */}
          <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded-md transition-colors ${
                chartType === 'line' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="折线图"
            >
              <LineChart className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-md transition-colors ${
                chartType === 'bar' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="柱状图"
            >
              <BarChart className="h-4 w-4" />
            </button>
          </div>
          
          {/* 时间范围选择 */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value as typeof timeRange)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">最近7天</option>
              <option value="month">最近30天</option>
              <option value="quarter">最近90天</option>
              <option value="year">最近一年</option>
              <option value="custom">自定义范围</option>
            </select>
            
            {/* 自定义日期选择器 */}
            {showCustomDatePicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-80">
                <div className="flex items-center space-x-2 mb-3">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">自定义时间范围</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">开始日期</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">结束日期</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => setShowCustomDatePicker(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    取消
                  </button>
                  <button
                    onClick={applyCustomDateRange}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    应用
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* 当前时间范围显示 */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{getTimeRangeText()}</span>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总完成任务</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCompleted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总新增任务</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalNewTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FolderOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总新增项目</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalNewProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">任务完成率</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <ReactECharts option={getCompletionChartOption()} style={{ height: '300px' }} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <ReactECharts option={getNewTasksChartOption()} style={{ height: '300px' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <ReactECharts option={getNewProjectsChartOption()} style={{ height: '300px' }} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {stats.avgDailyCompletion}
              </div>
              <div className="text-sm text-gray-600">日均完成任务</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <ReactECharts option={getTaskStatusTrendChartOption()} style={{ height: '400px' }} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <ReactECharts option={getProjectStatusTrendChartOption()} style={{ height: '400px' }} />
        </div>
      </div>
    </div>
  );
};

export default Trends; 