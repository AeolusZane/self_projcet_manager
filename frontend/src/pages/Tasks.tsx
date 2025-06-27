import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Search, X } from 'lucide-react';
import type { Task, Project } from '../types';
import { TaskService } from '../services/taskService';
import { ProjectService } from '../services/projectService';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter, priorityFilter, dateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        TaskService.getAllTasks(),
        ProjectService.getAllProjects()
      ]);
      console.log('加载到的任务数据:', tasksData);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const today = new Date();
        const taskDate = task.created_date ? new Date(task.created_date) : null;
        
        if (dateFilter === 'today') {
          matchesDate = taskDate && taskDate.toDateString() === today.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = taskDate && taskDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = taskDate && taskDate >= monthAgo;
        }
      }
      
      return matchesSearch && matchesStatus && matchesPriority && matchesDate;
    });
    
    setFilteredTasks(filtered);
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_name'>) => {
    try {
      await TaskService.createTask(taskData);
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('创建任务失败:', error);
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
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('确定要删除这个任务吗？')) return;
    try {
      await TaskService.deleteTask(id);
      loadData();
    } catch (error) {
      console.error('删除任务失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">任务管理</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>新建任务</span>
        </button>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="搜索任务..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有状态</option>
            <option value="pending">待处理</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有优先级</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有时间</option>
            <option value="today">今天</option>
            <option value="week">最近一周</option>
            <option value="month">最近一月</option>
          </select>
        </div>
      </div>

      {/* 任务列表 */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all'
              ? '没有找到匹配的任务' 
              : '暂无任务，开始创建您的第一个任务吧！'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && dateFilter === 'all' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>创建第一个任务</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
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

      {/* 统一的TaskModal组件 */}
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

export default Tasks; 