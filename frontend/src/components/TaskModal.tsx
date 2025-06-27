import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Task, Project } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_name'>) => void;
  task?: Task;
  projects: Project[];
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  task, 
  projects 
}) => {
  const [formData, setFormData] = useState<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_name'>>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    project_id: undefined,
    due_date: '',
    created_date: new Date().toISOString().split('T')[0], // 默认今天
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        project_id: task.project_id,
        due_date: task.due_date || '',
        created_date: task.created_date || new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        project_id: undefined,
        due_date: '',
        created_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 获取项目状态颜色
  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取项目状态文本
  const getProjectStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃';
      case 'completed': return '已完成';
      case 'archived': return '已归档';
      default: return status;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {task ? '编辑任务' : '新建任务'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              任务标题 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入任务标题"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="请输入任务描述（可选）"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                优先级
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">待处理</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              所属项目
            </label>
            <select
              value={formData.project_id || ''}
              onChange={(e) => handleInputChange('project_id', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">无项目</option>
              {projects.length === 0 ? (
                <option value="" disabled>暂无可用项目</option>
              ) : (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({getProjectStatusText(project.status)})
                  </option>
                ))
              )}
            </select>
            {projects.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                请先创建项目，然后才能将任务关联到项目
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                创建日期
              </label>
              <input
                type="date"
                value={formData.created_date}
                onChange={(e) => handleInputChange('created_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                截止日期
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {task ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal; 