import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const Analytics: React.FC = () => {
  const navItems = [
    { path: '', label: '图表分析' },
    { path: 'tables', label: '数据表格' },
    { path: 'trends', label: '趋势分析' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">统计分析</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <nav className="flex space-x-8 px-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === ''}
              className={({ isActive }) =>
                `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
};

export default Analytics; 