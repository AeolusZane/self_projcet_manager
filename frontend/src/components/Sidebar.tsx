import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  CheckSquare, 
  FolderOpen, 
  Calendar, 
  BarChart3, 
  Settings,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navItems = [
    { path: '/', icon: Home, label: '概览' },
    { path: '/tasks', icon: CheckSquare, label: '任务' },
    { path: '/projects', icon: FolderOpen, label: '项目' },
    { path: '/calendar', icon: Calendar, label: '日历' },
    { path: '/analytics', icon: BarChart3, label: '统计' },
    { path: '/users', icon: Users, label: '用户管理' },
    { path: '/settings', icon: Settings, label: '设置' },
  ];

  return (
    <aside className={`bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">TaskMaster</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title={collapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <nav className="mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                collapsed ? 'justify-center' : 'space-x-3'
              } ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-400 hover:bg-blue-50 hover:text-blue-700'
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar; 