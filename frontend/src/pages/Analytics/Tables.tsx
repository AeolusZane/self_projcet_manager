import React, { useState, useEffect } from 'react';
import { Search, X, Download, Trash2, Info } from 'lucide-react';
import type { Task, Project } from '../../types';
import { TaskService } from '../../services/taskService';
import { ProjectService } from '../../services/projectService';
import TaskModal from '../../components/TaskModal';
import ExportModal from '../../components/ExportModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAlert } from '../../components/Alert';
import { AuthService } from '../../services/authService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import DataTable from '../../components/DataTable';

const Tables: React.FC = () => {
  const { showAlert } = useAlert();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [taskPage, setTaskPage] = useState(1);
  const [projectPage, setProjectPage] = useState(1);
  
  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {}
  });

  const PAGE_SIZE = 20;

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
      showAlert('error', '加载失败', '数据加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || task.status === statusFilter;
      const matchesPriority = !priorityFilter || task.priority === priorityFilter;
      const matchesProject = !projectFilter || task.project_id === Number(projectFilter);
      
      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });
  };

  const filteredTasks = filterTasks();

  const handleTaskSelect = (taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
    setSelectAll(newSelected.size === filteredTasks.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTasks(new Set());
      setSelectAll(false);
    } else {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id!)));
      setSelectAll(true);
    }
  };

  const getSelectedTasks = () => {
    return tasks.filter(task => selectedTasks.has(task.id!));
  };

  const handleExportSelected = async () => {
    const selectedTaskList = getSelectedTasks();
    
    if (selectedTaskList.length === 0) {
      showAlert('warning', '提示', '请先选择要导出的任务');
      return;
    }

    try {
      const dataToExport = selectedTaskList.map(task => ({
        '任务标题': task.title,
        '描述': task.description || '',
        '状态': task.status === 'completed' ? '已完成' : task.status === 'in_progress' ? '进行中' : '待处理',
        '优先级': task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低',
        '所属项目': task.project_name || '无项目',
        '截止日期': task.due_date || '',
        '创建时间': task.created_at || '',
        '更新时间': task.updated_at || ''
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '选中任务');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `选中任务_${new Date().toISOString().split('T')[0]}.xlsx`);
      showAlert('success', '导出成功', '选中任务已成功导出');
    } catch (error) {
      console.error('导出失败:', error);
      showAlert('error', '导出失败', '导出失败，请重试');
    }
  };

  // 显示确认对话框
  const showConfirmDialog = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  // 隐藏确认对话框
  const hideConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // 批量删除选中的任务
  const handleDeleteSelected = async () => {
    const selectedTaskList = getSelectedTasks();
    
    if (selectedTaskList.length === 0) {
      showAlert('warning', '提示', '请先选择要删除的任务');
      return;
    }

    showConfirmDialog(
      '确认删除',
      `确定要删除选中的 ${selectedTaskList.length} 个任务吗？此操作不可撤销。`,
      async () => {
        try {
          // 批量删除
          await Promise.all(selectedTaskList.map(task => TaskService.deleteTask(task.id!)));
          await loadData();
          setSelectedTasks(new Set());
          setSelectAll(false);
          showAlert('success', '删除成功', '选中任务已成功删除');
        } catch (error) {
          console.error('批量删除失败:', error);
          showAlert('error', '删除失败', '删除失败，请重试');
        }
        hideConfirmDialog();
      },
      'danger'
    );
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

  // 删除单个任务
  const handleDeleteTask = async (taskId: number) => {
    showConfirmDialog(
      '确认删除',
      '确定要删除这个任务吗？此操作不可撤销。',
      async () => {
        try {
          await TaskService.deleteTask(taskId);
          await loadData();
          showAlert('success', '删除成功', '任务已成功删除');
        } catch (error) {
          console.error('删除失败:', error);
          showAlert('error', '删除失败', '删除失败，请重试');
        }
        hideConfirmDialog();
      },
      'danger'
    );
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  // 新建任务
  const handleTaskCreate = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_name'>) => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      showAlert('error', '登录提示', '请先登录');
      return;
    }
    try {
      await TaskService.createTask({
        ...taskData,
        user_id: currentUser.id,
      });
      await loadData();
      setIsEditModalOpen(false);
      setEditingTask(null);
      showAlert('success', '创建成功', '任务创建成功');
    } catch (error) {
      console.error('创建失败:', error);
      showAlert('error', '创建失败', '创建失败，请重试');
    }
  };

  // 编辑任务
  const handleTaskUpdate = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_name'>) => {
    if (!editingTask) return;
    try {
      await TaskService.updateTask(editingTask.id!, taskData);
      await loadData();
      setIsEditModalOpen(false);
      setEditingTask(null);
      showAlert('success', '更新成功', '任务更新成功');
    } catch (error) {
      console.error('更新失败:', error);
      showAlert('error', '更新失败', '更新失败，请重试');
    }
  };

  // 打开新建任务弹窗
  const handleCreateTask = () => {
    setEditingTask(null);
    setIsEditModalOpen(true);
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

  // 截断描述并转换 [[]] 为链接
  const truncateDescriptionWithLinks = (description: string, maxLength: number = 30) => {
    if (!description) return '-';
    
    const truncated = truncateDescription(description, maxLength);
    if (truncated === description) {
      // 如果不需要截断，转换 [[]] 为链接
      return convertUrlsToLinks(description);
    } else {
      // 如果需要截断，只显示截断的文本，不转换链接
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
      minute: '2-digit'
    });
  };

  const formatDateTimeToMinute = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
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
    const isOverdue = date < now && !isNaN(date.getTime());
    
    return (
      <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
        {date.toLocaleDateString('zh-CN')} {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        {isOverdue && <span className="ml-1 text-xs bg-red-100 text-red-800 px-1 rounded">已逾期</span>}
      </span>
    );
  };

  const handleExport = async (startDate: string, endDate: string, format: 'excel' | 'csv', statusFilter: string) => {
    try {
      let filteredTasks = tasks;
      
      if (startDate && endDate) {
        filteredTasks = tasks.filter(task => {
          if (!task.created_at) return false;
          const taskDate = new Date(task.created_at);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return taskDate >= start && taskDate <= end;
        });
      }
      
      if (statusFilter && statusFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
      }
      
      if (filteredTasks.length === 0) {
        showAlert('warning', '提示', '所选条件范围内没有任务数据');
        return;
      }
      
      const dataToExport = filteredTasks.map(task => ({
        '任务标题': task.title,
        '描述': task.description || '',
        '状态': task.status === 'completed' ? '已完成' : task.status === 'in_progress' ? '进行中' : '待处理',
        '优先级': task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低',
        '所属项目': task.project_name || '无项目',
        '截止日期': task.due_date || '',
        '创建时间': task.created_at || '',
        '更新时间': task.updated_at || ''
      }));
      
      if (format === 'excel') {
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '任务数据');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(data, `任务数据_${startDate}_${endDate}.xlsx`);
      } else {
        const csvContent = dataToExport.map(row => Object.values(row).join(',')).join('\n');
        const csvHeader = Object.keys(dataToExport[0]).join(',');
        const csvData = csvHeader + '\n' + csvContent;
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `任务数据_${startDate}_${endDate}.csv`);
      }
      
      showAlert('success', '导出成功', '任务数据已成功导出');
    } catch (error) {
      console.error('导出失败:', error);
      showAlert('error', '导出失败', '导出失败，请重试');
    }
  };

  const handleExportProjects = async () => {
    if (projects.length === 0) {
      showAlert('warning', '提示', '暂无项目数据可导出');
      return;
    }
    
    try {
      const dataToExport = projects.map(project => ({
        '项目名称': project.name,
        '描述': project.description || '',
        '状态': project.status === 'active' ? '活跃' : project.status === 'completed' ? '已完成' : '已归档',
        '创建时间': project.created_at || '',
        '更新时间': project.updated_at || ''
      }));
      
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '项目数据');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `项目数据_${new Date().toISOString().split('T')[0]}.xlsx`);
      showAlert('success', '导出成功', '项目数据已成功导出');
    } catch (error) {
      console.error('导出失败:', error);
      showAlert('error', '导出失败', '导出失败，请重试');
    }
  };

  const handleExportAll = async () => {
    if (tasks.length === 0 && projects.length === 0) {
      showAlert('warning', '提示', '暂无数据可导出');
      return;
    }
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // 导出任务数据
      if (tasks.length > 0) {
        const taskData = tasks.map(task => ({
          '任务标题': task.title,
          '描述': task.description || '',
          '状态': task.status === 'completed' ? '已完成' : task.status === 'in_progress' ? '进行中' : '待处理',
          '优先级': task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低',
          '所属项目': task.project_name || '无项目',
          '截止日期': task.due_date || '',
          '创建时间': task.created_at || '',
          '更新时间': task.updated_at || ''
        }));
        const taskSheet = XLSX.utils.json_to_sheet(taskData);
        XLSX.utils.book_append_sheet(workbook, taskSheet, '任务数据');
      }
      
      // 导出项目数据
      if (projects.length > 0) {
        const projectData = projects.map(project => ({
          '项目名称': project.name,
          '描述': project.description || '',
          '状态': project.status === 'active' ? '活跃' : project.status === 'completed' ? '已完成' : '已归档',
          '创建时间': project.created_at || '',
          '更新时间': project.updated_at || ''
        }));
        const projectSheet = XLSX.utils.json_to_sheet(projectData);
        XLSX.utils.book_append_sheet(workbook, projectSheet, '项目数据');
      }
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `全部数据_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);
      showAlert('success', '导出成功', '全部数据已成功导出');
    } catch (error) {
      console.error('导出全部数据失败:', error);
      showAlert('error', '导出失败', '导出失败，请重试');
    }
  };

  const filteredProjects = projects.filter(project => {
    return project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           project.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 分页相关
  const totalTaskPages = Math.ceil(filteredTasks.length / PAGE_SIZE);
  const pagedTasks = filteredTasks.slice((taskPage - 1) * PAGE_SIZE, taskPage * PAGE_SIZE);

  const totalProjectPages = Math.ceil(filteredProjects.length / PAGE_SIZE);
  const pagedProjects = filteredProjects.slice((projectPage - 1) * PAGE_SIZE, projectPage * PAGE_SIZE);

  // 只在数据/筛选/搜索/tab切换时重置分页，不依赖分页本身
  useEffect(() => {
    setTaskPage(1);
  }, [activeTab, searchTerm, statusFilter, priorityFilter, projectFilter, tasks]);

  useEffect(() => {
    setProjectPage(1);
  }, [activeTab, searchTerm, projects]);

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
              data={pagedTasks}
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
              data={pagedProjects}
              columns={projectColumns}
              selectedItems={new Set()}
              onItemSelect={() => {}}
              onSelectAll={() => {}}
              selectAll={false}
              showCheckbox={false}
              type="projects"
            />
          )}

          {/* 分页信息和分页器 */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {activeTab === 'tasks'
                ? `显示 ${pagedTasks.length} / ${filteredTasks.length} 条任务`
                : `显示 ${pagedProjects.length} / ${filteredProjects.length} 条项目`}
              {activeTab === 'tasks' && selectedTasks.size > 0 && (
                <span className="ml-2 text-blue-600">
                  (已选择 {selectedTasks.size} 个)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  (activeTab === 'tasks' && taskPage === 1) ||
                  (activeTab === 'projects' && projectPage === 1)
                }
                onClick={() => {
                  if (activeTab === 'tasks') {
                    setTaskPage(prev => Math.max(1, prev - 1));
                  } else {
                    setProjectPage(prev => Math.max(1, prev - 1));
                  }
                }}
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                {activeTab === 'tasks'
                  ? `${taskPage} / ${Math.max(1, totalTaskPages)}`
                  : `${projectPage} / ${Math.max(1, totalProjectPages)}`}
              </span>
              <button
                className="px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  (activeTab === 'tasks' && (taskPage >= totalTaskPages || totalTaskPages === 0)) ||
                  (activeTab === 'projects' && (projectPage >= totalProjectPages || totalProjectPages === 0))
                }
                onClick={() => {
                  if (activeTab === 'tasks') {
                    setTaskPage(prev => Math.min(totalTaskPages, prev + 1));
                  } else {
                    setProjectPage(prev => Math.min(totalProjectPages, prev + 1));
                  }
                }}
              >
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
        onSave={editingTask ? handleTaskUpdate : handleTaskCreate}
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
                        {selectedTaskDetail.created_at || '-'}
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

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={hideConfirmDialog}
      />
    </div>
  );
};

export default Tables; 