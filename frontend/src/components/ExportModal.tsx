import React, { useState, useEffect } from 'react';
import { X, Download, Calendar, Filter } from 'lucide-react';
import type { Task } from '../types';
import { TaskService } from '../services/taskService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (startDate: string, endDate: string, format: 'excel' | 'csv', statusFilter: string) => void;
  totalTasks: number;
  tasks: Task[];
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  totalTasks,
  tasks
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);

  // 设置默认日期范围（最近30天）
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // 计算筛选后的任务数量
  useEffect(() => {
    if (!startDate || !endDate) {
      setFilteredCount(0);
      return;
    }

    // 调用后端 API 获取筛选后的数量
    const fetchFilteredCount = async () => {
      try {
        const count = await TaskService.getFilteredCount({
          status: statusFilter,
          start_date: startDate,
          end_date: endDate
        });
        setFilteredCount(count);
      } catch (error) {
        console.error('获取筛选数量失败:', error);
        setFilteredCount(0);
      }
    };

    fetchFilteredCount();
  }, [startDate, endDate, statusFilter]);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      alert('请选择时间范围');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      alert('开始日期不能晚于结束日期');
      return;
    }

    if (filteredCount === 0) {
      alert('所选条件范围内没有任务数据');
      return;
    }

    setLoading(true);
    try {
      await onExport(startDate, endDate, exportFormat, statusFilter);
      onClose();
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">导出任务数据</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 时间范围选择 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">时间范围</label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">开始日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">结束日期</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 状态筛选 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">任务状态筛选</label>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">所有状态</option>
              <option value="pending">待处理</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>

          {/* 导出格式选择 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">导出格式</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value as 'excel' | 'csv')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Excel (.xlsx)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as 'excel' | 'csv')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">CSV (.csv)</span>
              </label>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">
              {tasks && tasks.length > 0 ? (
                <>
                  <p>将导出 <span className="font-semibold text-gray-900">{filteredCount}</span> 个任务</p>
                  <p className="text-xs text-gray-500 mt-1">
                    时间范围: {startDate} 至 {endDate}
                  </p>
                  <p className="text-xs text-gray-500">
                    状态筛选: {statusFilter === 'all' ? '所有状态' : 
                              statusFilter === 'pending' ? '待处理' :
                              statusFilter === 'in_progress' ? '进行中' :
                              statusFilter === 'completed' ? '已完成' : statusFilter}
                  </p>
                  <p className="text-xs text-gray-500">
                    总任务数: {totalTasks} 个
                  </p>
                </>
              ) : (
                <p className="text-gray-500">暂无任务数据</p>
              )}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={loading || filteredCount === 0 || !tasks || tasks.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>导出中...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>导出</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal; 