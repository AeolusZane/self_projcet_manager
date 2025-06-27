import React, { useState, useEffect } from 'react';
import { Search,X, Download,  Trash2,  Info } from 'lucide-react';
import type { Task, Project } from '../../types';
import { TaskService } from '../../services/taskService';
import { ProjectService } from '../../services/projectService';
import TaskModal from '../../components/TaskModal';
import ExportModal from '../../components/ExportModal';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import DataTable from '../../components/DataTable';

const Tables: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // 勾选相关状态
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // 详情弹框状态
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter, priorityFilter, projectFilter]);

  // 当筛选结果改变时，重置勾选状态
  useEffect(() => {
    setSelectedTasks(new Set());
    setSelectAll(false);
  }, [filteredTasks]);

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

  const filterTasks = () => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesProject = projectFilter === 'all' || task.project_id?.toString() === projectFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });
    
    setFilteredTasks(filtered);
  };

  // 处理单个任务勾选
  const handleTaskSelect = (taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
    
    // 检查是否全选
    setSelectAll(newSelected.size === filteredTasks.length);
  };

  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTasks(new Set());
      setSelectAll(false);
    } else {
      const allTaskIds = new Set(filteredTasks.map(task => task.id!));
      setSelectedTasks(allTaskIds);
      setSelectAll(true);
    }
  };

  // 获取选中的任务
  const getSelectedTasks = () => {
    return filteredTasks.filter(task => selectedTasks.has(task.id!));
  };

  // 导出选中的任务
  const handleExportSelected = async () => {
    const selectedTaskList = getSelectedTasks();
    
    if (selectedTaskList.length === 0) {
      alert('请先选择要导出的任务');
      return;
    }

    try {
      // 使用TaskService的导出方法
      const result = await TaskService.getTaskExportFormat(
        selectedTaskList.map(task => task.id!),
        {
          status: statusFilter,
          priority: priorityFilter,
          project_id: projectFilter,
          search: searchTerm
        }
      );
      
      if (result.total === 0) {
        alert('所选条件范围内没有任务数据');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(result.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '选中任务数据');
      
      // 使用后台返回的列宽配置
      worksheet['!cols'] = result.columnWidths;

      const fileName = `选中任务数据_${new Date().toISOString().slice(0, 10)}`;
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${fileName}.xlsx`);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 批量删除选中的任务
  const handleDeleteSelected = async () => {
    const selectedTaskList = getSelectedTasks();
    
    if (selectedTaskList.length === 0) {
      alert('请先选择要删除的任务');
      return;
    }

    if (!window.confirm(`确定要删除选中的 ${selectedTaskList.length} 个任务吗？`)) {
      return;
    }

    try {
      // 批量删除
      await Promise.all(selectedTaskList.map(task => TaskService.deleteTask(task.id!)));
      await loadData();
      setSelectedTasks(new Set());
      setSelectAll(false);
      alert('删除成功');
    } catch (error) {
      console.error('批量删除失败:', error);
      alert('删除失败，请重试');
    }
  };

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

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      try {
        await TaskService.deleteTask(taskId);
        await loadData();
      } catch (error) {
        console.error('删除任务失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleTaskUpdate = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_name'>) => {
    if (!editingTask) return;
    
    try {
      await TaskService.updateTask(editingTask.id!, taskData);
      await loadData();
      setIsEditModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('更新任务失败:', error);
      alert('更新失败，请重试');
    }
  };

  const handleViewDetail = (task: Task) => {
    setSelectedTaskDetail(task);
    setIsDetailModalOpen(true);
  };

  // 只将 [[]] 语法转换为超链接，其他文本保持原样
  const convertUrlsToLinks = (text: string) => {
    if (!text) return text;
    
    // 只处理 [[]] 语法
    const bracketRegex = /\[\[([^\]]+)\]\]/g;
    let processedText = text;
    const bracketLinks: Array<{ placeholder: string; link: string }> = [];
    let bracketIndex = 0;
    
    // 替换 [[]] 为占位符，并保存链接信息
    processedText = processedText.replace(bracketRegex, (match, linkText) => {
      const placeholder = `__BRACKET_LINK_${bracketIndex}__`;
      bracketLinks.push({ placeholder, link: linkText });
      bracketIndex++;
      return placeholder;
    });
    
    // 如果没有找到 [[]] 语法，直接返回原文本
    if (bracketLinks.length === 0) {
      return text;
    }
    
    // 将占位符替换为实际的链接
    const parts = processedText.split(/(__BRACKET_LINK_\d+__)/);
    const result = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const bracketLink = bracketLinks.find(link => link.placeholder === part);
      
      if (bracketLink) {
        // 这是占位符，替换为链接
        result.push(
          <a
            key={`bracket-${i}`}
            href={bracketLink.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {bracketLink.link}
          </a>
        );
      } else {
        // 这是普通文本
        result.push(part);
      }
    }
    
    return result;
  };

  const truncateDescription = (description: string, maxLength: number = 30) => {
    if (!description) return '-';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  // 截断描述并转换URL为链接
  const truncateDescriptionWithLinks = (description: string, maxLength: number = 30) => {
    if (!description) return '-';
    
    const truncated = truncateDescription(description, maxLength);
    if (truncated === description) {
      // 如果不需要截断，转换URL为链接
      return convertUrlsToLinks(description);
    } else {
      // 如果需要截断，只显示截断的文本，不转换URL
      return truncated;
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateTimeToMinute = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  const formatDueDateTime = (dueDate: string) => {
    if (!dueDate) return '-';
    
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let statusClass = '';
    let statusText = '';
    
    if (diffDays < 0) {
      statusClass = 'text-red-600';
      statusText = '已逾期';
    } else if (diffDays === 0) {
      statusClass = 'text-orange-600';
      statusText = '今天到期';
    } else if (diffDays <= 3) {
      statusClass = 'text-yellow-600';
      statusText = `${diffDays}天后到期`;
    } else {
      statusClass = 'text-gray-600';
      statusText = `${diffDays}天后到期`;
    }
    
    return (
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">
          {date.toLocaleDateString('zh-CN')} {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className={`text-xs ${statusClass}`}>
          {statusText}
        </span>
      </div>
    );
  };

  // 导出功能
  const handleExport = async (startDate: string, endDate: string, format: 'excel' | 'csv', statusFilter: string) => {
    if (tasks.length === 0) {
      alert('暂无任务数据可导出');
      return;
    }

    try {
      // 使用TaskService的导出方法
      const result = await TaskService.getTaskExportFormat(
        tasks.map(task => task.id!),
        {
          status: statusFilter,
          start_date: startDate,
          end_date: endDate
        }
      );

      if (result.total === 0) {
        alert('所选条件范围内没有任务数据');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(result.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '任务数据');
      
      // 使用后台返回的列宽配置
      worksheet['!cols'] = result.columnWidths;

      const statusText = statusFilter === 'all' ? '全部' : 
                        statusFilter === 'pending' ? '待处理' :
                        statusFilter === 'in_progress' ? '进行中' :
                        statusFilter === 'completed' ? '已完成' : statusFilter;
      
      const fileName = `任务数据_${startDate}_${endDate}_${statusText}`;
      
      if (format === 'excel') {
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${fileName}.xlsx`);
      } else {
        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${fileName}.csv`);
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 导出项目数据
  const handleExportProjects = async () => {
    if (projects.length === 0) {
      alert('暂无项目数据可导出');
      return;
    }

    try {
      // 使用ProjectService的导出方法
      const result = await ProjectService.getProjectExportFormat(
        projects.map(project => project.id!)
      );

      const worksheet = XLSX.utils.json_to_sheet(result.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '项目数据');
      
      // 使用后台返回的列宽配置
      worksheet['!cols'] = result.columnWidths;

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const fileName = `项目数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('导出项目失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 导出所有数据
  const handleExportAll = async () => {
    if (tasks.length === 0 && projects.length === 0) {
      alert('暂无数据可导出');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();
      
      if (tasks.length > 0) {
        // 使用TaskService的导出方法
        const taskResult = await TaskService.getTaskExportFormat(
          tasks.map(task => task.id!)
        );
        
        const taskWorksheet = XLSX.utils.json_to_sheet(taskResult.data);
        XLSX.utils.book_append_sheet(workbook, taskWorksheet, '任务数据');
        taskWorksheet['!cols'] = taskResult.columnWidths;
      }
      
      if (projects.length > 0) {
        // 使用ProjectService的导出方法
        const projectResult = await ProjectService.getProjectExportFormat(
          projects.map(project => project.id!)
        );
        
        const projectWorksheet = XLSX.utils.json_to_sheet(projectResult.data);
        XLSX.utils.book_append_sheet(workbook, projectWorksheet, '项目数据');
        projectWorksheet['!cols'] = projectResult.columnWidths;
      }
      
      // 统计汇总数据
      const statsData = [
        { '统计项': '总任务数', '数量': tasks.length },
        { '统计项': '已完成任务', '数量': tasks.filter(t => t.status === 'completed').length },
        { '统计项': '进行中任务', '数量': tasks.filter(t => t.status === 'in_progress').length },
        { '统计项': '待处理任务', '数量': tasks.filter(t => t.status === 'pending').length },
        { '统计项': '高优先级任务', '数量': tasks.filter(t => t.priority === 'high').length },
        { '统计项': '总项目数', '数量': projects.length },
        { '统计项': '活跃项目', '数量': projects.filter(p => p.status === 'active').length },
        { '统计项': '已完成项目', '数量': projects.filter(p => p.status === 'completed').length },
      ];
      
      const statsWorksheet = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsWorksheet, '统计汇总');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const fileName = `任务管理系统数据_${new Date().toISOString().slice(0, 10)}.xlsx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('导出全部数据失败:', error);
      alert('导出失败，请重试');
    }
  };

  const filteredProjects = projects.filter(project => {
    return project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           project.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 任务表格列配置
  const taskColumns = [
    {
      key: 'title',
      header: '任务标题',
      width: 'w-10',
      minWidth: '100px',
      render: (task: Task) => (
        <div className="text-sm font-medium text-gray-900 truncate" title={task.title}>
          {task.title}
        </div>
      )
    },
    {
      key: 'description',
      header: '详情',
      width: 'w-12',
      minWidth: '100px',
      render: (task: Task) => (
        task.description ? (
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500 truncate flex-1" title={task.description}>
              {truncateDescriptionWithLinks(task.description, 12)}
            </div>
            <button
              onClick={() => handleViewDetail(task)}
              className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800"
              title="查看详情"
            >
              <Info className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )
      )
    },
    {
      key: 'project_name',
      header: '项目',
      width: 'w-20',
      minWidth: '140px',
      render: (task: Task) => (
        <div className="text-sm text-gray-500 truncate" title={task.project_name || '-'}>
          {task.project_name || '-'}
        </div>
      )
    },
    {
      key: 'status',
      header: '状态',
      width: 'w-20',
      minWidth: '100px',
      render: (task: Task) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
          {task.status === 'completed' ? '已完成' : task.status === 'in_progress' ? '进行中' : '待处理'}
        </span>
      )
    },
    {
      key: 'priority',
      header: '优先级',
      width: 'w-24',
      minWidth: '80px',
      render: (task: Task) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
        </span>
      )
    },
    {
      key: 'due_date',
      header: '截止时间',
      width: 'w-28',
      minWidth: '140px',
      render: (task: Task) => (
        <span className="text-sm text-gray-500">
          {formatDueDateTime(task.due_date)}
        </span>
      )
    },
    {
      key: 'created_at',
      header: '创建时间',
      width: 'w-28',
      minWidth: '120px',
      render: (task: Task) => (
        <span className="text-sm text-gray-500">
          {task.created_at ? (
            <span 
              className="cursor-help"
              title={task.created_at}
            >
              {formatDate(task.created_at)}
            </span>
          ) : '-'}
        </span>
      )
    },
    {
      key: 'updated_at',
      header: '更新时间',
      width: 'w-28',
      minWidth: '120px',
      render: (task: Task) => (
        <span className="text-sm text-gray-500">
          {task.updated_at ? (
            <span 
              className="cursor-help"
              title={task.updated_at}
            >
              {formatDateTimeToMinute(task.updated_at)}
            </span>
          ) : '-'}
        </span>
      )
    }
  ];

  // 项目表格列配置
  const projectColumns = [
    {
      key: 'name',
      header: '项目名称',
      width: 'w-32',
      minWidth: '180px',
      render: (project: Project) => (
        <div className="text-sm font-medium text-gray-900 truncate" title={project.name}>
          {project.name}
        </div>
      )
    },
    {
      key: 'description',
      header: '描述',
      width: 'w-40',
      minWidth: '200px',
      render: (project: Project) => (
        <div className="text-sm text-gray-500 truncate" title={project.description || '-'}>
          {truncateDescription(project.description || '-', 20)}
        </div>
      )
    },
    {
      key: 'status',
      header: '状态',
      width: 'w-24',
      minWidth: '80px',
      render: (project: Project) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProjectStatusColor(project.status)}`}>
          {project.status === 'active' ? '活跃' : project.status === 'completed' ? '已完成' : '已归档'}
        </span>
      )
    },
    {
      key: 'created_at',
      header: '创建时间',
      width: 'w-28',
      minWidth: '120px',
      render: (project: Project) => (
        <span className="text-sm text-gray-500">
          {project.created_at ? (
            <span 
              className="cursor-help"
              title={formatDateTime(project.created_at)}
            >
              {formatDate(project.created_at)}
            </span>
          ) : '-'}
        </span>
      )
    },
    {
      key: 'updated_at',
      header: '更新时间',
      width: 'w-28',
      minWidth: '120px',
      render: (project: Project) => (
        <span className="text-sm text-gray-500">
          {project.updated_at ? (
            <span 
              className="cursor-help"
              title={formatDateTime(project.updated_at)}
            >
              {formatDate(project.updated_at)}
            </span>
          ) : '-'}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标签页切换 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              任务数据
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'projects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              项目数据
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* 搜索和过滤 */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder={`搜索${activeTab === 'tasks' ? '任务' : '项目'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {activeTab === 'tasks' && (
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
            )}
            
            {/* 导出按钮组 */}
            <div className="flex items-center space-x-2">
              {activeTab === 'tasks' ? (
                <>
                  {/* 选中任务操作按钮 */}
                  {selectedTasks.size > 0 && (
                    <div className="flex items-center space-x-2 mr-4 p-2 bg-blue-50 rounded-lg">
                      <span className="text-sm text-blue-700">
                        已选择 {selectedTasks.size} 个任务
                      </span>
                      <button
                        onClick={handleExportSelected}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        <Download className="h-3 w-3" />
                        <span>导出选中</span>
                      </button>
                      <button
                        onClick={handleDeleteSelected}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>删除选中</span>
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    disabled={tasks.length === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={tasks.length === 0 ? '暂无任务数据' : '导出任务'}
                  >
                    <Download className="h-4 w-4" />
                    <span>导出任务</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleExportProjects}
                  disabled={projects.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={projects.length === 0 ? '暂无项目数据' : '导出项目'}
                >
                  <Download className="h-4 w-4" />
                  <span>导出项目</span>
                </button>
              )}
              
              <button
                onClick={handleExportAll}
                disabled={tasks.length === 0 && projects.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={tasks.length === 0 && projects.length === 0 ? '暂无数据' : '导出全部数据'}
              >
                <Download className="h-4 w-4" />
                <span>导出全部</span>
              </button>
            </div>
          </div>

          {/* 数据表格 */}
          {activeTab === 'tasks' ? (
            <DataTable
              data={filteredTasks}
              columns={taskColumns}
              selectedItems={selectedTasks}
              onItemSelect={handleTaskSelect}
              onSelectAll={handleSelectAll}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onViewDetail={handleViewDetail}
              selectAll={selectAll}
              showCheckbox={true}
              type="tasks"
            />
          ) : (
            <DataTable
              data={filteredProjects}
              columns={projectColumns}
              selectedItems={new Set()}
              onItemSelect={() => {}}
              onSelectAll={() => {}}
              selectAll={false}
              showCheckbox={false}
              type="projects"
            />
          )}

          {/* 分页信息 */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              显示 {activeTab === 'tasks' ? filteredTasks.length : filteredProjects.length} 条记录
              {activeTab === 'tasks' && selectedTasks.size > 0 && (
                <span className="ml-2 text-blue-600">
                  (已选择 {selectedTasks.size} 个)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded hover:bg-gray-200">
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">1</span>
              <button className="px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded hover:bg-gray-200">
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 编辑任务模态框 */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleTaskUpdate}
        task={editingTask}
        projects={projects}
      />

      {/* 导出弹窗 */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        totalTasks={tasks.length}
        tasks={tasks}
      />

      {/* 详情弹框 */}
      {isDetailModalOpen && selectedTaskDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">任务详情</h2>
                  <p className="text-sm text-gray-500">查看任务的完整信息</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedTaskDetail(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* 基本信息 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">基本信息</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      任务标题
                    </label>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedTaskDetail.title}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      任务描述
                    </label>
                    <div className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap break-words">
                      {convertUrlsToLinks(selectedTaskDetail.description || '暂无描述')}
                    </div>
                  </div>
                </div>
              </div>

              {/* 状态和优先级 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">状态信息</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        当前状态
                      </label>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTaskDetail.status)}`}>
                        {selectedTaskDetail.status === 'completed' ? '已完成' : 
                         selectedTaskDetail.status === 'in_progress' ? '进行中' : '待处理'}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        优先级
                      </label>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedTaskDetail.priority)}`}>
                        {selectedTaskDetail.priority === 'high' ? '高' : 
                         selectedTaskDetail.priority === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">时间信息</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        创建日期
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedTaskDetail.created_date || '-'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        截止日期
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedTaskDetail.due_date || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 创建/更新时间 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    创建时间
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg break-words">
                    {selectedTaskDetail.created_at ? 
                      new Date(selectedTaskDetail.created_at).toLocaleString('zh-CN') : '-'
                    }
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    更新时间
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg break-words">
                    {selectedTaskDetail.updated_at ? 
                      new Date(selectedTaskDetail.updated_at).toLocaleString('zh-CN') : '-'
                    }
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedTaskDetail(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedTaskDetail(null);
                  handleEditTask(selectedTaskDetail);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                编辑任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables; 