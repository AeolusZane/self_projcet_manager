import request from 'supertest';
import express from 'express';
import taskRoutes from '../routes/tasks';
import { getDatabase } from '../database/init';

const app = express();
app.use(express.json());
app.use('/api/tasks', taskRoutes);

describe('Tasks API', () => {
  let testTaskId: number;
  
  // 清理测试数据
  beforeEach(() => {
    const db = getDatabase();
    db.run('DELETE FROM tasks', (err) => {
      if (err) console.error('清理任务数据失败:', err);
    });
  });

  describe('POST /api/tasks', () => {
    it('应该成功创建新任务', async () => {
      const newTask = {
        title: '测试任务',
        description: '这是一个测试任务',
        priority: 'high',
        status: 'pending'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('任务创建成功');
      testTaskId = response.body.id;
    });

    it('应该拒绝没有标题的任务', async () => {
      const invalidTask = {
        description: '没有标题的任务',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTask)
        .expect(400);

      expect(response.body.error).toBe('任务标题是必需的');
    });
  });

  describe('GET /api/tasks', () => {
    it('应该返回所有任务', async () => {
      // 先创建一些测试任务
      const tasks = [
        { title: '任务1', description: '第一个任务' },
        { title: '任务2', description: '第二个任务' }
      ];

      for (const task of tasks) {
        await request(app).post('/api/tasks').send(task);
      }

      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('created_at');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('应该返回指定任务', async () => {
      // 先创建一个任务
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: '获取测试任务', description: '用于测试获取单个任务' });

      const taskId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(response.body.id).toBe(taskId);
      expect(response.body.title).toBe('获取测试任务');
    });

    it('应该返回404当任务不存在时', async () => {
      const response = await request(app)
        .get('/api/tasks/99999')
        .expect(404);

      expect(response.body.error).toBe('任务不存在');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('应该成功更新任务', async () => {
      // 先创建一个任务
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: '原始任务', description: '原始描述' });

      const taskId = createResponse.body.id;

      const updateData = {
        title: '更新后的任务',
        description: '更新后的描述',
        status: 'completed',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('任务更新成功');

      // 验证更新是否成功
      const getResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(getResponse.body.title).toBe('更新后的任务');
      expect(getResponse.body.status).toBe('completed');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('应该成功删除任务', async () => {
      // 先创建一个任务
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: '待删除任务', description: '这个任务将被删除' });

      const taskId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(200);

      expect(response.body.message).toBe('任务删除成功');

      // 验证任务已被删除
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(404);
    });
  });
}); 