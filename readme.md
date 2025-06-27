# 个人任务管理系统

一个基于 React + TypeScript + Node.js 的现代化个人任务管理系统，支持任务管理、项目管理、数据分析和用户管理等功能。

## 🚀 功能特性

### 核心功能
- **任务管理**: 创建、编辑、删除任务，支持状态跟踪和优先级设置
- **项目管理**: 项目创建和管理，任务与项目关联
- **数据分析**: 任务趋势分析、数据表格展示、图表统计
- **用户管理**: 用户注册、登录、权限管理
- **数据导出**: 支持Excel和CSV格式的数据导出
- **智能分析**: 基于任务趋势的工作状态分析和建议

### 技术特性
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + TypeScript + SQLite
- **认证**: JWT Token 认证
- **数据库**: SQLite (轻量级，无需额外配置)
- **UI组件**: 自定义组件库，美观的现代化界面
- **数据可视化**: ECharts 图表库
- **文件处理**: Excel/CSV 导出功能

## 🎯 系统架构

## 🛠️ 系统要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

## 🛠️ 安装和部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd self_manage
```

### 2. 安装依赖

#### 安装后端依赖
```bash
cd backend
npm install
```

#### 安装前端依赖
```bash
cd ../frontend
npm install
```

### 3. 环境配置

#### 后端环境配置
在 `backend` 目录下创建 `.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# JWT配置
JWT_SECRET=your_jwt_secret_key_here

# 数据库配置
DB_PATH=./data/tasks.db

# OpenAI配置 (可选，用于AI分析功能)
OPENAI_API_KEY=your_openai_api_key_here
```

#### 前端环境配置
在 `frontend` 目录下创建 `.env` 文件：

```env
# API配置
VITE_API_BASE_URL=http://localhost:3001/api

# 应用配置
VITE_APP_TITLE=个人任务管理系统
```

### 4. 数据库初始化

#### 初始化数据库结构
```bash
cd backend
npm run build
npm start
```

#### 生成测试数据
```bash
cd backend
npm run generate-mock
```

这将创建以下测试数据：
- 5个测试用户 (admin, user1, user2, manager, developer)
- 多个项目和任务
- admin用户拥有85个任务用于测试

### 5. 启动服务

#### 启动后端服务
```bash
cd backend
npm run dev
```

后端服务将在 `http://localhost:3001` 启动

#### 启动前端服务
```bash
cd frontend
npm run dev
```

前端服务将在 `http://localhost:5173` 启动

## 📖 使用指南

### 1. 用户登录

访问 `http://localhost:5173`，使用以下测试账户登录：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| user1 | user123 | 普通用户 |
| user2 | user123 | 普通用户 |
| manager | manager123 | 经理 |
| developer | dev123 | 开发者 |

### 2. 主要功能模块

#### 概览页面
- 任务统计概览
- 快速创建任务
- 最近任务列表
- 数据导出功能

#### 任务管理
- 任务列表查看
- 任务创建和编辑
- 状态和优先级管理
- 批量操作（选择、删除、导出）

#### 项目管理
- 项目列表
- 项目创建和编辑
- 项目状态管理

#### 数据分析
- **表格视图**: 详细的任务和项目数据表格
- **趋势分析**: 任务创建和完成趋势图表
- **数据导出**: 支持按时间范围和状态筛选导出

#### 用户管理
- 用户列表查看
- 用户创建和编辑
- 用户统计信息

#### 个人设置
- 个人信息编辑
- 密码修改
- 账户设置

## 🔧 开发指南

### 项目结构
```

### 3. 性能监控

#### 使用Node.js内置监控
```javascript
// 在app.ts中添加
import * as cluster from 'cluster';

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  
  // 监控工作进程
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
}
```

## 🎯 更新和升级

### 1. 代码更新
```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
cd backend && npm install
cd ../frontend && npm install

# 重新构建
cd backend && npm run build
cd ../frontend && npm run build

# 重启服务
pm2 restart all
```

### 2. 数据库迁移
```bash
cd backend
npm run db:migrate
```

### 3. 回滚操作
```bash
# 回滚代码
git reset --hard HEAD~1

# 回滚数据库
cp backup/tasks_previous.db data/tasks.db

# 重启服务
pm2 restart all
```

## 🎯 贡献指南

### 开发流程

1. **Fork项目**
   ```bash
   git clone https://github.com/your-username/self_manage.git
   cd self_manage
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **开发功能**
   - 遵循代码规范
   - 编写测试用例
   - 更新文档

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   git push origin feature/amazing-feature
   ```

5. **创建Pull Request**
   - 描述功能变更
   - 关联相关Issue
   - 请求代码审查

### 代码规范

#### TypeScript规范
- 使用严格的类型检查
- 避免使用`any`类型
- 使用接口定义数据结构
- 遵循ESLint规则

#### React规范
- 使用函数组件和Hooks
- 组件名使用PascalCase
- Props接口以Props结尾
- 使用TypeScript定义Props

#### 提交信息规范