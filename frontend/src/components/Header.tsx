import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/authService';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const currentUser = AuthService.getCurrentUser();

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理退出登录
  const handleLogout = () => {
    AuthService.logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  // 处理导航到个人资料
  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">任务管理系统</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="搜索任务..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button className="relative p-2 text-gray-400 hover:text-gray-600">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
          </button>
          
          {/* 用户菜单 */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              title="用户菜单"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {currentUser?.username || '用户'}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* 下拉菜单 */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                {/* 用户信息 */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser?.username || '用户'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {currentUser?.email || 'user@example.com'}
                  </p>
                </div>

                {/* 菜单项 */}
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>个人资料</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>设置</span>
                </button>

                {/* 分割线 */}
                <div className="border-t border-gray-100 my-1"></div>

                {/* 退出登录 */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>退出登录</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 