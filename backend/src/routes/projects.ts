import express from 'express';
import { getDatabase } from '../database/init';
import { DateUtils } from '../utils/dateUtils';

const router = express.Router();

// 获取所有项目
router.get('/', (req: express.Request, res: express.Response) => {
  const db = getDatabase();
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: '用户未认证' });
  }

  db.all('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) {
      console.error('查询项目失败:', err);
      res.status(500).json({ error: '查询项目失败' });
      return;
    }
    res.json(rows);
  });
});

// 获取单个项目
router.get('/:id', (req: express.Request, res: express.Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: '用户未认证' });
  }

  db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [id, userId], (err, project) => {
    if (err) {
      console.error('查询项目失败:', err);
      res.status(500).json({ error: '查询项目失败' });
      return;
    }

    if (!project) {
      res.status(404).json({ error: '项目不存在或无权限访问' });
      return;
    }

    res.json(project);
  });
});

// 创建项目
router.post('/', (req, res) => {
  const { name, description, status, user_id } = req.body;
  
  if (!name || !user_id) {
    return res.status(400).json({ error: '项目名称和用户ID是必需的' });
  }
  
  const db = getDatabase();
  const currentTime = DateUtils.getCurrentLocalString();
  
  db.run(
    'INSERT INTO projects (name, description, status, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description || '', status || 'active', user_id, currentTime, currentTime],
    function(err) {
      if (err) {
        console.error('创建项目失败:', err);
        return res.status(500).json({ error: '创建项目失败' });
      }
      
      // 获取创建的项目详情
      db.get('SELECT * FROM projects WHERE id = ?', [this.lastID], (err, project) => {
        if (err) {
          console.error('获取项目详情失败:', err);
          return res.status(500).json({ error: '获取项目详情失败' });
        }
        
        res.status(201).json(project);
      });
    }
  );
});

// 更新项目
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  const userId = (req as any).user.userId;
  
  if (!name) {
    return res.status(400).json({ error: '项目名称是必需的' });
  }
  
  const db = getDatabase();
  const currentTime = DateUtils.getCurrentLocalString();
  
  const sql = 'UPDATE projects SET name = ?, description = ?, status = ?, updated_at = ? WHERE id = ? AND user_id = ?';
  
  db.run(sql, [name, description || '', status || 'active', currentTime, id, userId], function(err) {
    if (err) {
      console.error('更新项目失败:', err);
      return res.status(500).json({ error: '更新项目失败' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: '项目不存在或无权限修改' });
    }
    
    // 获取更新后的项目详情
    db.get('SELECT * FROM projects WHERE id = ?', [id], (err, project) => {
      if (err) {
        console.error('获取项目详情失败:', err);
        return res.status(500).json({ error: '获取项目详情失败' });
      }
      
      res.json(project);
    });
  });
});

// 删除项目
router.delete('/:id', (req: express.Request, res: express.Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: '用户未认证' });
  }

  // 先检查项目是否属于当前用户
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [id, userId], (err, project) => {
    if (err) {
      console.error('查询项目失败:', err);
      res.status(500).json({ error: '查询项目失败' });
      return;
    }

    if (!project) {
      res.status(404).json({ error: '项目不存在或无权限访问' });
      return;
    }

    db.run('DELETE FROM projects WHERE id = ? AND user_id = ?', [id, userId], function(err) {
      if (err) {
        console.error('删除项目失败:', err);
        res.status(500).json({ error: '删除项目失败' });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: '项目不存在或无权限访问' });
        return;
      }
      
      res.json({ message: '项目删除成功' });
    });
  });
});

export default router; 