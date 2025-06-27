import React from 'react';
import { Edit, Trash2, Calendar, Tag, Clock } from 'lucide-react';
import type { Task } from '../types';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
          {task.title}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => task.id && onDelete(task.id)}
            className="p-1 text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {task.description}
        </p>
      )}
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status === 'completed' ? '已完成' : task.status === 'in_progress' ? '进行中' : '待处理'}
          </span>
        </div>
        
        {task.due_date && (
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            {format(new Date(task.due_date), 'MM/dd')}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        {task.created_date && (
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            创建: {format(new Date(task.created_date), 'yyyy-MM-dd')}
          </div>
        )}
        
        {task.project_name && (
          <div className="flex items-center">
            <Tag className="h-3 w-3 mr-1" />
            {task.project_name}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard; 