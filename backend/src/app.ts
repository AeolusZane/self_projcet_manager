import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/init';
import taskRoutes from './routes/tasks';
import projectRoutes from './routes/projects';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import { authenticateToken } from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// 认证路由（不需要验证）
app.use('/api/auth', authRoutes);
console.log('认证路由已注册: /api/auth');

// 需要认证的路由
app.use('/api/tasks', authenticateToken, taskRoutes);
console.log('任务路由已注册: /api/tasks');

app.use('/api/projects', authenticateToken, projectRoutes);
console.log('项目路由已注册: /api/projects');

app.use('/api/users', authenticateToken, userRoutes);
console.log('用户路由已注册: /api/users');

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 测试认证接口是否可访问
app.get('/api/auth/test', (req, res) => {
  res.json({ message: '认证路由可访问' });
});

// 404处理
app.use('*', (req, res) => {
  console.log(`404 - 未找到路由: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: '接口不存在',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/test',
      'GET /api/users',
      'GET /api/users/:id',
      'POST /api/users',
      'PUT /api/users/:id',
      'DELETE /api/users/:id'
    ]
  });
});

// 启动服务器
app.listen(PORT, async () => {
  try {
    await initializeDatabase();
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/health`);
    console.log(`认证测试: http://localhost:${PORT}/api/auth/test`);
    console.log(`注册接口: http://localhost:${PORT}/api/auth/register`);
    console.log(`登录接口: http://localhost:${PORT}/api/auth/login`);
    console.log(`用户管理接口: http://localhost:${PORT}/api/users`);
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
});

export default app; 