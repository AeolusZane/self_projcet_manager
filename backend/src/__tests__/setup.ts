import { initializeDatabase } from '../database/init';
import path from 'path';
import fs from 'fs';

// 测试数据库路径
const testDbPath = path.join(__dirname, '../../data/test.db');

// 清理测试数据库
beforeAll(async () => {
  // 确保测试数据库目录存在
  const testDbDir = path.dirname(testDbPath);
  if (!fs.existsSync(testDbDir)) {
    fs.mkdirSync(testDbDir, { recursive: true });
  }
  
  // 删除旧的测试数据库
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  
  // 初始化测试数据库
  await initializeDatabase();
});

// 清理测试数据
afterAll(() => {
  // 删除测试数据库
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
}); 