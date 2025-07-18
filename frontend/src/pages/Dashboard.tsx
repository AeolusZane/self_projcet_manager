import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, AlertCircle, Search, Edit, Trash2, Download, AlertTriangle, BarChart3, Calendar, Target } from 'lucide-react';
import type { Task, Project } from '../types';
import { TaskService } from '../services/taskService';
import { ProjectService } from '../services/projectService';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { AuthService } from '../services/authService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
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

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_name'>) => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      alert('请先登录');
      return;
    }
    
    try {
      await TaskService.createTask({
        ...taskData,
        user_id: currentUser.id,
      });
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('创建任务失败:', error);
      alert('创建任务失败，请重试');
    }
  };

  const handleUpdateTask = async (taskData: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_name'>>) => {
    if (!editingTask?.id) return;
    try {
      await TaskService.updateTask(editingTask.id, taskData);
      setIsModalOpen(false);
      setEditingTask(undefined);
      loadData();
    } catch (error) {
      console.error('更新任务失败:', error);
      alert('更新任务失败，请重试');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('确定要删除这个任务吗？')) return;
    try {
      await TaskService.deleteTask(id);
      loadData();
    } catch (error) {
      console.error('删除任务失败:', error);
      alert('删除任务失败，请重试');
    }
  };

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length;
    
    return { total, completed, pending, inProgress, overdue };
  };

  const stats = getStats();

  const handleExportExcel = () => {
    // 检查是否有任务数据
    if (tasks.length === 0) {
      alert('暂无任务数据可导出');
      return;
    }

    // 导出所有任务数据
    const exportData = tasks.map(task => ({
      '任务ID': task.id,
      '任务标题': task.title,
      '任务描述': task.description || '',
      '所属项目': task.project_name || '无项目',
      '任务状态': task.status === 'completed' ? '已完成' : 
                  task.status === 'in_progress' ? '进行中' : '待处理',
      '优先级': task.priority === 'high' ? '高' : 
                task.priority === 'medium' ? '中' : '低',
      '创建日期': task.created_at || '',
      '截止日期': task.due_date || '',
      '创建时间': task.created_at ? new Date(task.created_at).toLocaleString('zh-CN') : '',
      '更新时间': task.updated_at ? new Date(task.updated_at).toLocaleString('zh-CN') : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '任务数据');
    
    // 设置列宽
    const columnWidths = [
      { wch: 8 },  // 任务ID
      { wch: 20 }, // 任务标题
      { wch: 30 }, // 任务描述
      { wch: 15 }, // 所属项目
      { wch: 10 }, // 任务状态
      { wch: 8 },  // 优先级
      { wch: 12 }, // 创建日期
      { wch: 12 }, // 截止日期
      { wch: 20 }, // 创建时间
      { wch: 20 }, // 更新时间
    ];
    worksheet['!cols'] = columnWidths;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Dashboard任务数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(blob, fileName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">概览</h1>
          <p className="text-sm text-gray-500 mt-1">查看您的任务和项目概览</p>
        </div>
        <div className='flex items-center space-x-4'>
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={handleExportExcel}
            disabled={tasks.length === 0}
            title={tasks.length === 0 ? '暂无任务数据' : '导出所有任务数据'}
          >
            <Download className="h-4 w-4" />
            <span>导出</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>新建任务</span>
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总任务</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">已完成</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">进行中</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">待处理</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">已逾期</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作区域 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">创建新任务</p>
              <p className="text-sm text-gray-500">添加一个新的任务到您的列表</p>
            </div>
          </button>
          
          <button
            onClick={() => window.location.href = '/tasks'}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <Search className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">查看所有任务</p>
              <p className="text-sm text-gray-500">浏览和管理您的所有任务</p>
            </div>
          </button>
          
          <button
            onClick={() => window.location.href = '/projects'}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">管理项目</p>
              <p className="text-sm text-gray-500">查看和编辑您的项目</p>
            </div>
          </button>
        </div>
      </div>

      {/* 最近任务 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">最近任务</h2>
          {tasks.length > 6 && (
            <button
              onClick={() => window.location.href = '/tasks'}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部 →
            </button>
          )}
        </div>
        
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <CheckCircle className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500 mb-4">暂无任务，开始创建您的第一个任务吧！</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>创建第一个任务</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.slice(0, 6).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(task) => {
                  setEditingTask(task);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* 任务模态框 */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(undefined);
        }}
        onSave={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
        projects={projects}
      />
    </div>
  );
};

export default Dashboard; 