import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import type { Task, Project } from '../types';
import { ProjectService } from '../services/projectService';
import { TaskService } from '../services/taskService';

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_name'>>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    project_id: undefined,
    due_date: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsData = await ProjectService.getAllProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('加载项目失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('请输入任务标题');
      return;
    }

    setLoading(true);
    try {
      await TaskService.createTask(formData);
      alert('任务创建成功！');
      navigate('/tasks');
    } catch (error) {
      console.error('创建任务失败:', error);
      alert('创建任务失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>返回</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">创建新任务</h1>
        </div>
      </div>

      {/* 表单 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 任务标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入任务标题"
              required
            />
          </div>

          {/* 任务描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入任务描述（可选）"
            />
          </div>

          {/* 优先级和状态 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                优先级
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">待处理</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>

          {/* 所属项目 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              所属项目
            </label>
            <select
              value={formData.project_id || ''}
              onChange={(e) => handleInputChange('project_id', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">无</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* 截止日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              截止日期
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange('due_date', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
              <span>取消</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? '创建中...' : '创建任务'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 表单验证提示 */}
      <div className="mt-4 text-sm text-gray-600">
        <p>* 为必填字段</p>
      </div>
    </div>
  );
};

export default CreateTask; 