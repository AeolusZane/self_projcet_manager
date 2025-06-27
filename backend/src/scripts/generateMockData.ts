import { initializeDatabase, getDatabase } from '../database/init';
import bcrypt from 'bcrypt';

// Mock数据生成器
const mockData = {
  // 用户数据
  users: [
    { username: 'admin', email: 'admin@example.com', password: 'admin123' },
    { username: 'user1', email: 'user1@example.com', password: 'user123' },
    { username: 'user2', email: 'user2@example.com', password: 'user123' },
    { username: 'manager', email: 'manager@example.com', password: 'manager123' },
    { username: 'developer', email: 'developer@example.com', password: 'dev123' },
  ],

  // 项目数据模板
  projectTemplates: [
    {
      name: '电商平台开发',
      description: '开发一个完整的电商平台，包括前端、后端和移动端',
      status: 'active'
    },
    {
      name: '数据分析系统',
      description: '构建企业级数据分析平台，支持实时数据监控和报表生成',
      status: 'active'
    },
    {
      name: '移动应用开发',
      description: '开发iOS和Android双平台移动应用',
      status: 'in_progress'
    },
    {
      name: '网站重构项目',
      description: '对现有网站进行现代化重构，提升用户体验和性能',
      status: 'active'
    },
    {
      name: 'API接口开发',
      description: '为第三方合作伙伴开发RESTful API接口',
      status: 'completed'
    },
    {
      name: '数据库优化',
      description: '优化现有数据库结构，提升查询性能',
      status: 'active'
    },
    {
      name: '安全审计项目',
      description: '对系统进行全面的安全审计和漏洞修复',
      status: 'in_progress'
    },
    {
      name: '云迁移项目',
      description: '将现有系统迁移到云平台，提升可扩展性',
      status: 'active'
    },
    {
      name: 'AI智能系统',
      description: '开发基于机器学习的智能推荐和分析系统',
      status: 'active'
    },
    {
      name: '微服务架构重构',
      description: '将单体应用重构为微服务架构，提升系统可维护性',
      status: 'in_progress'
    }
  ],

  // 任务数据模板 - 81个任务
  taskTemplates: [
    { title: '需求分析', description: '与客户沟通，收集和分析项目需求，制定详细的需求文档', status: 'completed', priority: 'high' },
    { title: '系统设计', description: '设计系统架构，包括数据库设计、API设计和前端界面设计', status: 'completed', priority: 'high' },
    { title: '前端开发', description: '使用React/Vue等框架开发用户界面，实现响应式设计', status: 'in_progress', priority: 'medium' },
    { title: '后端开发', description: '使用Node.js/Python等开发服务器端API和业务逻辑', status: 'in_progress', priority: 'medium' },
    { title: '数据库设计', description: '设计数据库表结构，优化查询性能，建立索引', status: 'completed', priority: 'high' },
    { title: '单元测试', description: '编写单元测试用例，确保代码质量和功能正确性', status: 'pending', priority: 'medium' },
    { title: '集成测试', description: '进行系统集成测试，验证各模块间的协作', status: 'pending', priority: 'medium' },
    { title: '性能优化', description: '优化系统性能，包括数据库查询、缓存策略等', status: 'pending', priority: 'low' },
    { title: '文档编写', description: '编写技术文档、用户手册和API文档', status: 'pending', priority: 'low' },
    { title: '部署上线', description: '准备生产环境，部署系统并监控运行状态', status: 'pending', priority: 'high' },
    { title: '用户培训', description: '对用户进行系统使用培训，提供技术支持', status: 'pending', priority: 'medium' },
    { title: 'Bug修复', description: '修复测试过程中发现的问题和用户反馈的bug', status: 'in_progress', priority: 'high' },
    { title: '功能优化', description: '根据用户反馈优化现有功能，提升用户体验', status: 'pending', priority: 'low' },
    { title: '安全加固', description: '进行安全漏洞扫描，修复潜在的安全问题', status: 'pending', priority: 'high' },
    { title: '代码审查', description: '对代码进行审查，确保代码质量和规范', status: 'in_progress', priority: 'medium' },
    { title: 'UI/UX设计', description: '设计用户界面和用户体验，创建原型和设计稿', status: 'completed', priority: 'medium' },
    { title: 'API文档编写', description: '编写详细的API文档，包括接口说明和示例代码', status: 'in_progress', priority: 'medium' },
    { title: '数据库迁移', description: '执行数据库迁移脚本，更新数据库结构', status: 'pending', priority: 'high' },
    { title: '监控系统搭建', description: '搭建系统监控和日志收集系统', status: 'in_progress', priority: 'medium' },
    { title: '自动化测试', description: '搭建自动化测试框架，编写端到端测试', status: 'pending', priority: 'medium' },
    { title: 'CI/CD流程搭建', description: '搭建持续集成和持续部署流程', status: 'in_progress', priority: 'high' },
    { title: '负载测试', description: '进行系统负载测试，评估系统性能瓶颈', status: 'pending', priority: 'medium' },
    { title: '数据备份策略', description: '制定数据备份和恢复策略', status: 'completed', priority: 'high' },
    { title: '第三方集成', description: '集成第三方服务和API，如支付、短信等', status: 'in_progress', priority: 'medium' },
    { title: '移动端适配', description: '优化移动端显示效果，确保响应式设计', status: 'pending', priority: 'low' },
    { title: 'SEO优化', description: '进行搜索引擎优化，提升网站排名', status: 'pending', priority: 'low' },
    { title: '多语言支持', description: '添加多语言支持功能', status: 'pending', priority: 'medium' },
    { title: '数据可视化', description: '开发数据可视化组件和图表', status: 'in_progress', priority: 'medium' },
    { title: '实时通知系统', description: '开发实时通知和消息推送系统', status: 'pending', priority: 'high' },
    { title: '权限管理系统', description: '设计和实现用户权限管理系统', status: 'completed', priority: 'high' },
    { title: '日志分析系统', description: '开发日志收集和分析系统', status: 'in_progress', priority: 'medium' },
    { title: '缓存策略优化', description: '优化系统缓存策略，提升响应速度', status: 'pending', priority: 'medium' },
    { title: '错误处理机制', description: '完善系统错误处理和异常捕获机制', status: 'in_progress', priority: 'high' },
    { title: '国际化配置', description: '配置系统国际化，支持多语言切换', status: 'pending', priority: 'low' },
    { title: '主题定制功能', description: '开发主题定制和个性化设置功能', status: 'pending', priority: 'low' },
    { title: '数据导入导出', description: '开发数据导入导出功能', status: 'completed', priority: 'medium' },
    { title: '报表生成系统', description: '开发报表生成和导出系统', status: 'in_progress', priority: 'medium' },
    { title: '工作流引擎', description: '设计和实现工作流引擎', status: 'pending', priority: 'high' },
    { title: '消息队列系统', description: '搭建消息队列系统，处理异步任务', status: 'in_progress', priority: 'high' },
    { title: '分布式锁机制', description: '实现分布式锁机制，确保数据一致性', status: 'pending', priority: 'medium' },
    { title: '定时任务系统', description: '开发定时任务调度系统', status: 'completed', priority: 'medium' },
    { title: '文件上传优化', description: '优化文件上传功能，支持大文件上传', status: 'in_progress', priority: 'medium' },
    { title: '搜索功能优化', description: '优化搜索功能，支持全文搜索和模糊匹配', status: 'pending', priority: 'medium' },
    { title: '数据同步机制', description: '实现多系统间的数据同步机制', status: 'in_progress', priority: 'high' },
    { title: '系统配置管理', description: '开发系统配置管理功能', status: 'completed', priority: 'medium' },
    { title: '用户行为分析', description: '开发用户行为分析和统计功能', status: 'pending', priority: 'low' },
    { title: 'A/B测试框架', description: '搭建A/B测试框架，支持功能测试', status: 'pending', priority: 'medium' },
    { title: '灰度发布系统', description: '开发灰度发布和版本控制系统', status: 'in_progress', priority: 'high' },
    { title: '系统健康检查', description: '开发系统健康检查和自愈机制', status: 'completed', priority: 'high' },
    { title: 'API限流机制', description: '实现API限流和防护机制', status: 'in_progress', priority: 'high' },
    { title: '数据加密存储', description: '实现敏感数据加密存储功能', status: 'pending', priority: 'high' },
    { title: '审计日志系统', description: '开发操作审计和日志记录系统', status: 'completed', priority: 'medium' },
    { title: '系统性能监控', description: '开发系统性能监控和告警系统', status: 'in_progress', priority: 'high' },
    { title: '自动化部署', description: '实现自动化部署和回滚机制', status: 'pending', priority: 'high' },
    { title: '容器化部署', description: '将应用容器化，支持Docker部署', status: 'in_progress', priority: 'medium' },
    { title: '微服务拆分', description: '将单体应用拆分为微服务架构', status: 'pending', priority: 'high' },
    { title: '服务网格部署', description: '部署服务网格，实现服务间通信管理', status: 'pending', priority: 'medium' },
    { title: '云原生改造', description: '将应用改造为云原生架构', status: 'in_progress', priority: 'high' },
    { title: '数据库分库分表', description: '实现数据库分库分表，提升系统性能', status: 'pending', priority: 'high' },
    { title: '缓存预热机制', description: '实现缓存预热，提升系统启动速度', status: 'in_progress', priority: 'medium' },
    { title: '服务降级策略', description: '实现服务降级和熔断机制', status: 'pending', priority: 'high' },
    { title: '链路追踪系统', description: '开发分布式链路追踪系统', status: 'in_progress', priority: 'medium' },
    { title: '配置中心搭建', description: '搭建配置中心，统一管理配置信息', status: 'completed', priority: 'medium' },
    { title: '服务注册发现', description: '实现服务注册和发现机制', status: 'in_progress', priority: 'high' },
    { title: '负载均衡配置', description: '配置负载均衡，提升系统可用性', status: 'pending', priority: 'medium' },
    { title: '数据库读写分离', description: '实现数据库读写分离，提升性能', status: 'in_progress', priority: 'high' },
    { title: '缓存穿透防护', description: '实现缓存穿透防护机制', status: 'pending', priority: 'medium' },
    { title: '缓存雪崩防护', description: '实现缓存雪崩防护机制', status: 'pending', priority: 'medium' },
    { title: '数据库连接池优化', description: '优化数据库连接池配置', status: 'completed', priority: 'medium' },
    { title: 'JVM参数调优', description: '调优JVM参数，提升应用性能', status: 'in_progress', priority: 'high' },
    { title: 'GC日志分析', description: '分析GC日志，优化垃圾回收', status: 'pending', priority: 'medium' },
    { title: '内存泄漏检测', description: '检测和修复内存泄漏问题', status: 'in_progress', priority: 'high' },
    { title: '线程池优化', description: '优化线程池配置，提升并发性能', status: 'pending', priority: 'medium' },
    { title: '死锁检测机制', description: '实现死锁检测和预防机制', status: 'pending', priority: 'high' },
    { title: '数据库索引优化', description: '优化数据库索引，提升查询性能', status: 'in_progress', priority: 'high' },
    { title: 'SQL语句优化', description: '优化SQL语句，提升查询效率', status: 'pending', priority: 'medium' },
    { title: '慢查询监控', description: '监控慢查询，及时优化性能', status: 'completed', priority: 'medium' },
    { title: '数据库备份恢复', description: '实现数据库备份和恢复机制', status: 'in_progress', priority: 'high' },
    { title: '数据一致性检查', description: '检查数据一致性，修复数据问题', status: 'pending', priority: 'high' },
    { title: '数据迁移工具', description: '开发数据迁移工具', status: 'in_progress', priority: 'medium' },
    { title: '数据清洗流程', description: '建立数据清洗流程', status: 'pending', priority: 'medium' },
    { title: '数据质量监控', description: '监控数据质量，确保数据准确性', status: 'completed', priority: 'medium' },
    { title: '数据血缘分析', description: '分析数据血缘关系', status: 'pending', priority: 'low' },
    { title: '数据脱敏处理', description: '实现数据脱敏处理', status: 'in_progress', priority: 'high' },
    { title: '数据归档策略', description: '制定数据归档策略', status: 'pending', priority: 'medium' },
    { title: '数据生命周期管理', description: '管理数据生命周期', status: 'in_progress', priority: 'medium' },
    { title: '数据治理框架', description: '建立数据治理框架', status: 'pending', priority: 'high' },
    { title: '元数据管理', description: '管理元数据信息', status: 'completed', priority: 'medium' },
    { title: '数据目录建设', description: '建设数据目录', status: 'in_progress', priority: 'medium' },
    { title: '数据标准制定', description: '制定数据标准', status: 'pending', priority: 'high' },
    { title: '数据安全审计', description: '进行数据安全审计', status: 'in_progress', priority: 'high' },
    { title: '数据访问控制', description: '实现数据访问控制', status: 'completed', priority: 'high' },
    { title: '数据加密传输', description: '实现数据加密传输', status: 'in_progress', priority: 'high' },
    { title: '数据完整性校验', description: '校验数据完整性', status: 'pending', priority: 'medium' },
    { title: '数据版本管理', description: '管理数据版本', status: 'in_progress', priority: 'medium' },
    { title: '数据变更追踪', description: '追踪数据变更', status: 'pending', priority: 'medium' },
    { title: '数据回滚机制', description: '实现数据回滚机制', status: 'completed', priority: 'high' },
    { title: '数据快照管理', description: '管理数据快照', status: 'in_progress', priority: 'medium' },
    { title: '数据同步监控', description: '监控数据同步状态', status: 'pending', priority: 'medium' },
    { title: '数据一致性协议', description: '实现数据一致性协议', status: 'in_progress', priority: 'high' },
    { title: '分布式事务处理', description: '处理分布式事务', status: 'pending', priority: 'high' },
    { title: '事务隔离级别优化', description: '优化事务隔离级别', status: 'in_progress', priority: 'medium' },
    { title: '死锁预防策略', description: '制定死锁预防策略', status: 'pending', priority: 'high' },
    { title: '事务超时处理', description: '处理事务超时', status: 'completed', priority: 'medium' },
    { title: '事务回滚机制', description: '实现事务回滚机制', status: 'in_progress', priority: 'high' },
    { title: '事务日志管理', description: '管理事务日志', status: 'pending', priority: 'medium' },
    { title: '事务监控告警', description: '监控事务状态并告警', status: 'in_progress', priority: 'medium' },
    { title: '事务性能优化', description: '优化事务性能', status: 'pending', priority: 'high' },
    { title: '事务并发控制', description: '控制事务并发', status: 'completed', priority: 'high' },
    { title: '事务隔离性保证', description: '保证事务隔离性', status: 'in_progress', priority: 'high' },
    { title: '事务持久性保证', description: '保证事务持久性', status: 'pending', priority: 'high' },
    { title: '事务原子性保证', description: '保证事务原子性', status: 'in_progress', priority: 'high' },
    { title: '事务一致性保证', description: '保证事务一致性', status: 'completed', priority: 'high' }
  ]
};

// 生成随机日期
function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 生成随机截止日期（未来30天内）
function getRandomDueDate(): string {
  const now = new Date();
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const dueDate = getRandomDate(now, future);
  return dueDate.toISOString().slice(0, 16);
}

// 生成随机创建日期（过去90天内）
function getRandomCreatedAt(): string {
  const now = new Date();
  const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const createdAt = getRandomDate(past, now);
  return createdAt.toISOString();
}

// 生成随机更新时间
function getRandomUpdatedAt(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const updatedAt = getRandomDate(created, now);
  return updatedAt.toISOString();
}

// 生成用户数据
async function generateUsers(): Promise<number> {
  const db = getDatabase();
  let adminUserId = 0;
  
  for (const user of mockData.users) {
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(user.password, saltRounds);
      
      const result = await new Promise<{ lastID: number }>((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
          [user.username, user.email, passwordHash],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ lastID: this.lastID });
            }
          }
        );
      });
      
      console.log(`用户 ${user.username} 创建成功，ID: ${result.lastID}`);
      
      if (user.username === 'admin') {
        adminUserId = result.lastID;
      }
    } catch (error) {
      console.error(`创建用户 ${user.username} 失败:`, error);
    }
  }
  
  return adminUserId;
}

// 生成项目数据
async function generateProjects(adminUserId: number): Promise<number[]> {
  const db = getDatabase();
  const projectIds: number[] = [];
  
  for (const projectTemplate of mockData.projectTemplates) {
    try {
      const result = await new Promise<{ lastID: number }>((resolve, reject) => {
        db.run(
          'INSERT INTO projects (name, description, status, user_id) VALUES (?, ?, ?, ?)',
          [projectTemplate.name, projectTemplate.description, projectTemplate.status, adminUserId],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ lastID: this.lastID });
            }
          }
        );
      });
      
      projectIds.push(result.lastID);
      console.log(`为用户 ${adminUserId} 创建项目: ${projectTemplate.name}，ID: ${result.lastID}`);
    } catch (error) {
      console.error(`创建项目 ${projectTemplate.name} 失败:`, error);
    }
  }
  
  return projectIds;
}

// 生成任务数据 - 为admin用户生成81个任务
async function generateTasks(adminUserId: number, projectIds: number[]): Promise<void> {
  const db = getDatabase();
  
  console.log(`开始为admin用户生成 ${mockData.taskTemplates.length} 个任务...`);
  
  for (let i = 0; i < mockData.taskTemplates.length; i++) {
    const taskTemplate = mockData.taskTemplates[i];
    const projectId = projectIds[i % projectIds.length]; // 循环分配项目
    
    try {
      const createdAt = getRandomCreatedAt();
      const updatedAt = getRandomUpdatedAt(createdAt);
      const dueDate = getRandomDueDate();
      
      const result = await new Promise<{ lastID: number }>((resolve, reject) => {
        db.run(
          `INSERT INTO tasks (
            title, description, status, priority, project_id, user_id, 
            due_date, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            taskTemplate.title,
            taskTemplate.description,
            taskTemplate.status,
            taskTemplate.priority,
            projectId,
            adminUserId,
            dueDate,
            createdAt,
            updatedAt
          ],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ lastID: this.lastID });
            }
          }
        );
      });
      
      console.log(`为用户 ${adminUserId} 创建任务: ${taskTemplate.title}，ID: ${result.lastID}`);
    } catch (error) {
      console.error(`创建任务 ${taskTemplate.title} 失败:`, error);
    }
  }
  
  console.log(`为admin用户生成 ${mockData.taskTemplates.length} 个任务用于测试`);
}

// 主函数
async function generateMockData() {
  try {
    console.log('开始生成Mock数据...');
    
    // 初始化数据库
    await initializeDatabase();
    console.log('数据库初始化完成');
    
    // 清空现有数据
    const db = getDatabase();
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM tasks', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM projects', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM users', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('清空现有数据...');
    
    // 生成用户数据
    console.log('开始生成用户数据...');
    const adminUserId = await generateUsers();
    
    // 生成项目数据
    console.log('开始生成项目数据...');
    const projectIds = await generateProjects(adminUserId);
    
    // 生成任务数据
    console.log('开始生成任务数据...');
    await generateTasks(adminUserId, projectIds);
    
    console.log('Mock数据生成完成！');
    process.exit(0);
  } catch (error) {
    console.error('生成Mock数据失败:', error);
    process.exit(1);
  }
}

// 运行脚本
generateMockData(); 