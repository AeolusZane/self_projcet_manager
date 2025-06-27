import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, UserPlus, Users, UserCheck, UserX } from 'lucide-react';
import type { User, CreateUserRequest, UpdateUserRequest } from '../types/user';
import { UserService } from '../services/userService';
import UserModal from '../components/UserModal';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    userGrowthRate: 0
  });

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const usersData = await UserService.getAllUsers();
      setUsers(usersData);
      
      // 计算统计信息
      const totalUsers = usersData.length;
      const activeUsers = usersData.length; // 简化处理，所有用户都算活跃
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newUsersThisMonth = usersData.filter(user => 
        new Date(user.created_at) >= thisMonth
      ).length;
      const userGrowthRate = totalUsers > 0 ? Math.round((newUsersThisMonth / totalUsers) * 100) : 0;
      
      setStats({
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        userGrowthRate
      });
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 搜索和筛选
  useEffect(() => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  // 创建用户
  const handleCreateUser = async (userData: CreateUserRequest) => {
    try {
      await UserService.createUser(userData);
      setIsCreateModalOpen(false);
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  };

  // 编辑用户
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  // 更新用户
  const handleUpdateUser = async (userData: UpdateUserRequest) => {
    if (!editingUser) return;
    
    try {
      await UserService.updateUser(editingUser.id, userData);
      setIsEditModalOpen(false);
      setEditingUser(null);
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定要删除这个用户吗？此操作不可撤销。')) return;
    
    try {
      await UserService.deleteUser(userId);
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('删除用户失败:', error);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化相对时间
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return '今天';
    } else if (diffInDays === 1) {
      return '昨天';
    } else if (diffInDays < 7) {
      return `${diffInDays}天前`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks}周前`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `${months}个月前`;
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
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理系统中的所有用户账户
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span>添加用户</span>
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总用户数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">活跃用户</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">本月新增</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newUsersThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserX className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">增长率</p>
              <p className="text-2xl font-bold text-gray-900">{stats.userGrowthRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索用户名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            共 {filteredUsers.length} 个用户
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  邮箱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  更新时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(user.created_at)}</div>
                    <div className="text-sm text-gray-500">{formatRelativeTime(user.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(user.updated_at)}</div>
                    <div className="text-sm text-gray-500">{formatRelativeTime(user.updated_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="编辑用户"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="删除用户"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无用户</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? '没有找到匹配的用户' : '开始添加第一个用户'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                添加用户
              </button>
            )}
          </div>
        )}
      </div>

      {/* 创建用户模态框 */}
      {isCreateModalOpen && (
        <UserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateUser}
          mode="create"
        />
      )}

      {/* 编辑用户模态框 */}
      {isEditModalOpen && editingUser && (
        <UserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          onSave={handleUpdateUser}
          mode="edit"
          user={editingUser}
        />
      )}
    </div>
  );
};

export default UsersPage; 