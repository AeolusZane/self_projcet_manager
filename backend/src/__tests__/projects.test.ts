import request from 'supertest';
import express from 'express';
import projectRoutes from '../routes/projects';
import { getDatabase } from '../database/init';

const app = express();
app.use(express.json());
app.use('/api/projects', projectRoutes);

describe('Projects API', () => {
  let testProjectId: number;
  
  // 清理测试数据
  beforeEach(() => {
    const db = getDatabase();
    db.run('DELETE FROM projects', (err) => {
      if (err) console.error('清理项目数据失败:', err);
    });
  });

  describe('POST /api/projects', () => {
    it('应该成功创建新项目', async () => {
      const newProject = {
        name: '测试项目',
        description: '这是一个测试项目',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(newProject)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.message).toBe('项目创建成功');
      testProjectId = response.body.id;
    });

    it('应该拒绝没有名称的项目', async () => {
      const invalidProject = {
        description: '没有名称的项目',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(invalidProject)
        .expect(400);

      expect(response.body.error).toBe('项目名称是必需的');
    });
  });

  describe('GET /api/projects', () => {
    it('应该返回所有项目', async () => {
      // 先创建一些测试项目
      const projects = [
        { name: '项目1', description: '第一个项目' },
        { name: '项目2', description: '第二个项目' }
      ];

      for (const project of projects) {
        await request(app).post('/api/projects').send(project);
      }

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('created_at');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('应该返回指定项目', async () => {
      // 先创建一个项目
      const createResponse = await request(app)
        .post('/api/projects')
        .send({ name: '获取测试项目', description: '用于测试获取单个项目' });

      const projectId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(response.body.id).toBe(projectId);
      expect(response.body.name).toBe('获取测试项目');
    });

    it('应该返回404当项目不存在时', async () => {
      const response = await request(app)
        .get('/api/projects/99999')
        .expect(404);

      expect(response.body.error).toBe('项目不存在');
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('应该成功更新项目', async () => {
      // 先创建一个项目
      const createResponse = await request(app)
        .post('/api/projects')
        .send({ name: '原始项目', description: '原始描述' });

      const projectId = createResponse.body.id;

      const updateData = {
        name: '更新后的项目',
        description: '更新后的描述',
        status: 'completed'
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('项目更新成功');

      // 验证更新是否成功
      const getResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(getResponse.body.name).toBe('更新后的项目');
      expect(getResponse.body.status).toBe('completed');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('应该成功删除项目', async () => {
      // 先创建一个项目
      const createResponse = await request(app)
        .post('/api/projects')
        .send({ name: '待删除项目', description: '这个项目将被删除' });

      const projectId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .expect(200);

      expect(response.body.message).toBe('项目删除成功');

      // 验证项目已被删除
      await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(404);
    });
  });
}); 