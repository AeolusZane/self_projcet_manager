import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/init';
import taskRoutes from './routes/tasks';
import projectRoutes from './routes/projects';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initializeDatabase();
    console.log('数据库初始化完成');
    
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer(); 