import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CreateTask from './pages/CreateTask';
import Analytics from './pages/Analytics';
import Charts from './pages/Analytics/Charts';
import Tables from './pages/Analytics/Tables';
import Trends from './pages/Analytics/Trends';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthService } from './services/authService';
import Users from './pages/Users';
import Profile from './pages/Profile';

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const auth = AuthService.isAuthenticated();
      setIsAuthenticated(auth);
      setIsLoading(false);
      
      // 调试信息
      console.log('认证检查:', {
        pathname: location.pathname,
        isAuthenticated: auth,
        token: AuthService.getToken(),
        user: AuthService.getCurrentUser()
      });
    };

    checkAuth();
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('用户未认证，重定向到登录页面');
    // 保存当前路径，登录后可以重定向回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// 公开路由组件（已登录用户访问登录/注册页面时重定向到首页）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const auth = AuthService.isAuthenticated();
      setIsAuthenticated(auth);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 公开路由 - 未登录用户可以访问 */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        
        {/* 受保护的路由 - 需要登录才能访问，都使用Layout包装 */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <Layout>
              <Tasks />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/tasks/create" element={
          <ProtectedRoute>
            <Layout>
              <CreateTask />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 统计页面路由 */}
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        }>
          <Route index element={<Charts />} />
          <Route path="charts" element={<Charts />} />
          <Route path="tables" element={<Tables />} />
          <Route path="trends" element={<Trends />} />
        </Route>
        
        {/* 用户管理页面 */}
        <Route path="/users" element={
          <ProtectedRoute>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 个人信息页面 */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 项目页面 */}
        <Route path="/projects" element={
          <ProtectedRoute>
            <Layout>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">项目管理</h1>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-gray-600">项目页面开发中...</p>
                </div>
              </div>
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 日历页面 */}
        <Route path="/calendar" element={
          <ProtectedRoute>
            <Layout>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">日历视图</h1>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-gray-600">日历页面开发中...</p>
                </div>
              </div>
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 设置页面 */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">系统设置</h1>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-gray-600">设置页面开发中...</p>
                </div>
              </div>
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
