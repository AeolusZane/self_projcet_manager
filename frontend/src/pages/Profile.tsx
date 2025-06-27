import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Edit, Save, X, Eye, EyeOff, Key, Shield } from 'lucide-react';
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';
import type { User as UserType } from '../types/user';

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // 加载用户数据
  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        const userData = await UserService.getUserById(currentUser.id);
        setUser(userData);
        setFormData({
          username: userData.username,
          email: userData.email
        });
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // 处理表单输入变化
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 处理密码输入变化
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 切换密码显示
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = '用户名是必需的';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符';
    }

    if (!formData.email.trim()) {
      newErrors.email = '邮箱是必需的';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = '请输入有效的邮箱地址';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 验证密码表单
  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = '当前密码是必需的';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = '新密码是必需的';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = '新密码长度至少6位';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = '确认密码是必需的';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存个人信息
  const handleSaveProfile = async () => {
    if (!validateForm() || !user) return;

    try {
      await UserService.updateUser(user.id, formData);
      setSuccessMessage('个人信息更新成功！');
      setIsEditing(false);
      await loadUserData(); // 重新加载数据
      
      // 清除成功消息
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('更新个人信息失败:', error);
      setErrors({ general: '更新失败，请重试' });
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!validatePasswordForm() || !user) return;

    try {
      await UserService.resetUserPassword(user.id, passwordData.newPassword);
      setSuccessMessage('密码修改成功！');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // 清除成功消息
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('修改密码失败:', error);
      setErrors({ general: '密码修改失败，请重试' });
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrors({});
    if (user) {
      setFormData({
        username: user.username,
        email: user.email
      });
    }
  };

  // 取消修改密码
  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setErrors({});
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">用户信息加载失败</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">个人信息</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理您的账户信息和安全设置
          </p>
        </div>
      </div>

      {/* 成功消息 */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}

      {/* 错误消息 */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：个人信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息卡片 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                  >
                    <Edit className="h-4 w-4" />
                    <span>编辑</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center space-x-2 px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md"
                    >
                      <Save className="h-4 w-4" />
                      <span>保存</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      <X className="h-4 w-4" />
                      <span>取消</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* 用户名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    用户名
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.username ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{user.username}</span>
                    </div>
                  )}
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                {/* 邮箱 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{user.email}</span>
                    </div>
                  )}
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* 用户ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    用户ID
                  </label>
                  <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 安全设置卡片 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">安全设置</h2>
                {!isChangingPassword ? (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                  >
                    <Key className="h-4 w-4" />
                    <span>修改密码</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleChangePassword}
                      className="flex items-center space-x-2 px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md"
                    >
                      <Save className="h-4 w-4" />
                      <span>保存</span>
                    </button>
                    <button
                      onClick={handleCancelPasswordChange}
                      className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      <X className="h-4 w-4" />
                      <span>取消</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* 当前密码 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    当前密码
                  </label>
                  {isChangingPassword ? (
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {showPasswords.current ? passwordData.currentPassword : '********'}
                      </span>
                    </div>
                  )}
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                  )}
                </div>

                {/* 新密码 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    新密码
                  </label>
                  {isChangingPassword ? (
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.newPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {showPasswords.new ? passwordData.newPassword : '********'}
                      </span>
                    </div>
                  )}
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                </div>

                {/* 确认密码 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    确认密码
                  </label>
                  {isChangingPassword ? (
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {showPasswords.confirm ? passwordData.confirmPassword : '********'}
                      </span>
                    </div>
                  )}
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 