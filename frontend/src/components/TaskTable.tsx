import React from 'react';
import { Edit, Trash2, CheckSquare, Square, Info } from 'lucide-react';
import type { Task } from '../types';

interface TaskTableProps {
  tasks: Task[];
  selectedTasks: Set<number>;
  onTaskSelect: (taskId: number) => void;
  onSelectAll: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onViewDetail: (task: Task) => void;
  selectAll: boolean;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  formatDueDateTime: (dueDate: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
  formatDateTimeToMinute: (dateString: string) => string;
  truncateDescription: (description: string, maxLength: number) => string;
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  selectedTasks,
  onTaskSelect,
  onSelectAll,
  onEditTask,
  onDeleteTask,
  onViewDetail,
  selectAll,
  getStatusColor,
  getPriorityColor,
  formatDueDateTime,
  formatDate,
  formatDateTimeToMinute,
  truncateDescription
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
              <button
                onClick={onSelectAll}
                className="flex items-center justify-center w-4 h-4"
              >
                {selectAll ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
              任务
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-15">
              详情
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
              项目
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
              状态
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
              优先级
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
              截止时间
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
              创建时间
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
              更新时间
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 w-12">
                <button
                  onClick={() => onTaskSelect(task.id!)}
                  className="flex items-center justify-center w-4 h-4"
                >
                  {selectedTasks.has(task.id!) ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </td>
              <td className="px-6 py-4 w-10">
                <div className="text-sm font-medium text-gray-900 truncate" title={task.title}>
                  {task.title}
                </div>
              </td>
              <td className="px-6 py-4 w-15">
                {task.description ? (
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-500 truncate flex-1" title={task.description}>
                      {truncateDescription(task.description, 15)}
                    </div>
                    <button
                      onClick={() => onViewDetail(task)}
                      className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800"
                      title="查看详情"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 w-28">
                <div className="text-sm text-gray-500 truncate" title={task.project_name || '-'}>
                  {task.project_name || '-'}
                </div>
              </td>
              <td className="px-6 py-4 w-40">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                  {task.status === 'completed' ? '已完成' : task.status === 'in_progress' ? '进行中' : '待处理'}
                </span>
              </td>
              <td className="px-6 py-4 w-40">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                </span>
              </td>
              <td className="px-6 py-4 w-36 text-sm text-gray-500">
                {formatDueDateTime(task.due_date)}
              </td>
              <td className="px-6 py-4 w-36 text-sm text-gray-500">
                {task.created_at ? (
                  <span 
                    className="cursor-help"
                    title={task.created_at}
                  >
                    {formatDate(task.created_at)}
                  </span>
                ) : '-'}
              </td>
              <td className="px-6 py-4 w-36 text-sm text-gray-500">
                {task.updated_at ? (
                  <span 
                    className="cursor-help"
                    title={task.updated_at}
                  >
                    {formatDateTimeToMinute(task.updated_at)}
                  </span>
                ) : '-'}
              </td>
              <td className="px-6 py-4 w-40 text-sm font-medium space-x-4">
                <button
                  className="text-blue-600 hover:text-blue-900"
                  title="编辑"
                  onClick={() => onEditTask(task)}
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  className="text-red-600 hover:text-red-900"
                  title="删除"
                  onClick={() => onDeleteTask(task.id!)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTable; 