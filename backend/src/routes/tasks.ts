import express from 'express';
import { getDatabase } from '../database/init';
import { DateUtils } from '../utils/dateUtils';

const router = express.Router();

// 获取所有任务（支持筛选）
router.get('/', (req: express.Request, res: express.Response) => {
  const db = getDatabase();
  const { 
    status, 
    priority, 
    project_id, 
    start_date, 
    end_date,
    search 
  } = req.query;
  const userId = req.user?.userId; // 使用可选链操作符

  if (!userId) {
    return res.status(401).json({ error: '用户未认证' });
  }

  let sql = `
    SELECT t.*, p.name as project_name 
    FROM tasks t 
    LEFT JOIN projects p ON t.project_id = p.id 
    WHERE t.user_id = ?
  `;
  const params: any[] = [userId];

  // 状态筛选
  if (status && status !== 'all') {
    sql += ' AND t.status = ?';
    params.push(status);
  }

  // 优先级筛选
  if (priority && priority !== 'all') {
    sql += ' AND t.priority = ?';
    params.push(priority);
  }

  // 项目筛选
  if (project_id && project_id !== 'all') {
    sql += ' AND t.project_id = ?';
    params.push(project_id);
  }

  // 日期范围筛选
  if (start_date) {
    sql += ' AND DATE(t.created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND DATE(t.created_at) <= ?';
    params.push(end_date);
  }

  // 搜索筛选
  if (search) {
    sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  sql += ' ORDER BY t.created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('查询任务失败:', err);
      res.status(500).json({ error: '查询任务失败' });
      return;
    }
    res.json(rows);
  });
});

// 获取筛选后的任务数量（用于导出）
router.get('/filtered-count', (req, res) => {
  const db = getDatabase();
  const { 
    status, 
    start_date, 
    end_date 
  } = req.query;

  let sql = 'SELECT COUNT(*) as count FROM tasks WHERE 1=1';
  const params: any[] = [];

  // 状态筛选
  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }

  // 日期范围筛选
  if (start_date) {
    sql += ' AND DATE(created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND DATE(created_at) <= ?';
    params.push(end_date);
  }

  db.get(sql, params, (err, row) => {
    if (err) {
      console.error('查询任务数量失败:', err);
      res.status(500).json({ error: '查询任务数量失败' });
      return;
    }
    res.json({ count: row.count });
  });
});

// 导出任务数据
router.get('/export', (req, res) => {
  const db = getDatabase();
  const { 
    status, 
    start_date, 
    end_date,
    format = 'excel'
  } = req.query;

  let sql = `
    SELECT t.*, p.name as project_name 
    FROM tasks t 
    LEFT JOIN projects p ON t.project_id = p.id 
    WHERE 1=1
  `;
  const params: any[] = [];

  // 状态筛选
  if (status && status !== 'all') {
    sql += ' AND t.status = ?';
    params.push(status);
  }

  // 日期范围筛选
  if (start_date) {
    sql += ' AND DATE(t.created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND DATE(t.created_at) <= ?';
    params.push(end_date);
  }

  sql += ' ORDER BY t.created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('导出任务失败:', err);
      res.status(500).json({ error: '导出任务失败' });
      return;
    }

    // 格式化数据
    const exportData = rows.map(task => {
      // 格式化更新时间到分钟
      let formattedUpdatedAt = '';
      if (task.updated_at) {
        const date = new Date(task.updated_at);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          formattedUpdatedAt = `${year}-${month}-${day} ${hours}:${minutes}`;
        }
      }

      return {
        '任务ID': task.id,
        '标题': task.title,
        '描述': task.description || '',
        '所属项目': task.project_name || '无',
        '任务状态': task.status === 'completed' ? '已完成' : 
                    task.status === 'in_progress' ? '进行中' : '待处理',
        '优先级': task.priority === 'high' ? '高' : 
                  task.priority === 'medium' ? '中' : '低',
        '创建日期': task.created_at || '',
        '截止日期': task.due_date || '',
        '创建时间': task.created_at ? new Date(task.created_at).toLocaleString('zh-CN') : '',
        '更新时间': formattedUpdatedAt,
      };
    });

    res.json({
      data: exportData,
      total: rows.length,
      filters: { status, start_date, end_date, format }
    });
  });
});

// 获取单个任务
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const query = `
    SELECT t.*, p.name as project_name 
    FROM tasks t 
    LEFT JOIN projects p ON t.project_id = p.id 
    WHERE t.id = ?
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '任务不存在' });
      return;
    }
    res.json(row);
  });
});

// 创建新任务
router.post('/', (req, res) => {
  const db = getDatabase();
  const {
    title,
    description = '',
    status = 'pending',
    priority = 'medium',
    project_id = null,
    due_date = null,
    user_id,
    created_at = null
  } = req.body;

  if (!title || !user_id) {
    return res.status(400).json({ error: '任务标题和用户ID是必需的' });
  }

  const now = new Date().toISOString();

  db.run(
    `INSERT INTO tasks 
      (title, description, status, priority, project_id, user_id, due_date, created_at, updated_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description,
      status,
      priority,
      project_id,
      user_id,
      due_date,
      now,
      now,
      created_at || now.split('T')[0]
    ],
    function (err) {
      if (err) {
        console.error('创建任务失败:', err);
        return res.status(500).json({ error: '创建任务失败' });
      }
      // 返回新建的任务ID
      res.status(201).json({ id: this.lastID });
    }
  );
});

// 更新任务
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, project_id, due_date } = req.body;
  const userId = (req as any).user.userId;
  
  if (!title) {
    return res.status(400).json({ error: '任务标题是必需的' });
  }
  
  const db = getDatabase();
  const currentTime = DateUtils.getCurrentLocalString();
  
  // 如果状态变为completed，设置completed_at
  let completedAt = null;
  if (status === 'completed') {
    completedAt = currentTime;
  }
  
  const updateFields = [
    title, description || '', status || 'pending', priority || 'medium', 
    project_id || null, due_date || null, currentTime, completedAt, id, userId
  ];
  
  const sql = `
    UPDATE tasks 
    SET title = ?, description = ?, status = ?, priority = ?, 
        project_id = ?, due_date = ?, updated_at = ?, 
        completed_at = CASE WHEN status = 'completed' AND completed_at IS NULL THEN ? ELSE completed_at END
    WHERE id = ? AND user_id = ?
  `;
  
  db.run(sql, updateFields, function(err) {
    if (err) {
      console.error('更新任务失败:', err);
      return res.status(500).json({ error: '更新任务失败' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: '任务不存在或无权限修改' });
    }
    
    // 获取更新后的任务详情
    db.get(
      'SELECT t.*, p.name as project_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = ?',
      [id],
      (err, task) => {
        if (err) {
          console.error('获取任务详情失败:', err);
          return res.status(500).json({ error: '获取任务详情失败' });
        }
        
        res.json(task);
      }
    );
  });
});

// 删除任务
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  const query = 'DELETE FROM tasks WHERE id = ?';
  
  db.run(query, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '任务不存在' });
      return;
    }
    res.json({ message: '任务删除成功' });
  });
});

// 获取导出数据格式（新增接口）
router.post('/export-format', (req, res) => {
  const { taskIds, filters } = req.body;
  
  if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
    res.status(400).json({ error: '任务ID列表是必需的' });
    return;
  }

  const db = getDatabase();
  let sql = `
    SELECT t.*, p.name as project_name 
    FROM tasks t 
    LEFT JOIN projects p ON t.project_id = p.id 
    WHERE t.id IN (${taskIds.map(() => '?').join(',')})
  `;
  const params = [...taskIds];

  // 如果有筛选条件，添加筛选逻辑
  if (filters) {
    const { status, priority, project_id, start_date, end_date, search } = filters;
    
    if (status && status !== 'all') {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    
    if (priority && priority !== 'all') {
      sql += ' AND t.priority = ?';
      params.push(priority);
    }
    
    if (project_id && project_id !== 'all') {
      sql += ' AND t.project_id = ?';
      params.push(project_id);
    }
    
    if (start_date) {
      sql += ' AND DATE(t.created_at) >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      sql += ' AND DATE(t.created_at) <= ?';
      params.push(end_date);
    }
    
    if (search) {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
  }

  sql += ' ORDER BY t.created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('获取导出数据格式失败:', err);
      res.status(500).json({ error: '获取导出数据格式失败' });
      return;
    }

    // 格式化数据
    const exportData = rows.map(task => {
      // 格式化更新时间到分钟
      let formattedUpdatedAt = '';
      if (task.updated_at) {
        const date = new Date(task.updated_at);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          formattedUpdatedAt = `${year}-${month}-${day} ${hours}:${minutes}`;
        }
      }

      // 格式化创建时间
      let formattedCreatedAt = '';
      if (task.created_at) {
        const date = new Date(task.created_at);
        if (!isNaN(date.getTime())) {
          formattedCreatedAt = date.toLocaleString('zh-CN');
        }
      }

      return {
        '任务ID': task.id,
        '标题': task.title,
        '描述': task.description || '',
        '所属项目': task.project_name || '无',
        '任务状态': task.status === 'completed' ? '已完成' : 
                    task.status === 'in_progress' ? '进行中' : '待处理',
        '优先级': task.priority === 'high' ? '高' : 
                  task.priority === 'medium' ? '中' : '低',
        '创建日期': task.created_at || '',
        '截止日期': task.due_date || '',
        '创建时间': formattedCreatedAt,
        '更新时间': formattedUpdatedAt,
      };
    });

    // 返回列宽配置
    const columnWidths = [
      { wch: 8 },  // 任务ID
      { wch: 20 }, // 任务标题
      { wch: 30 }, // 任务描述
      { wch: 15 }, // 所属项目
      { wch: 10 }, // 任务状态
      { wch: 8 },  // 优先级
      { wch: 12 }, // 创建日期
      { wch: 12 }, // 截止日期
      { wch: 20 }, // 创建时间
      { wch: 20 }, // 更新时间
    ];

    res.json({
      data: exportData,
      total: rows.length,
      columnWidths,
      filters: filters || {}
    });
  });
});

// 获取项目导出数据格式（新增接口）
router.post('/projects/export-format', (req, res) => {
  const { projectIds } = req.body;
  
  if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
    res.status(400).json({ error: '项目ID列表是必需的' });
    return;
  }

  const db = getDatabase();
  const sql = `
    SELECT * FROM projects 
    WHERE id IN (${projectIds.map(() => '?').join(',')})
    ORDER BY created_at DESC
  `;

  db.all(sql, projectIds, (err, rows) => {
    if (err) {
      console.error('获取项目导出数据格式失败:', err);
      res.status(500).json({ error: '获取项目导出数据格式失败' });
      return;
    }

    // 格式化数据
    const exportData = rows.map(project => {
      let formattedCreatedAt = '';
      if (project.created_at) {
        const date = new Date(project.created_at);
        if (!isNaN(date.getTime())) {
          formattedCreatedAt = date.toLocaleString('zh-CN');
        }
      }

      let formattedUpdatedAt = '';
      if (project.updated_at) {
        const date = new Date(project.updated_at);
        if (!isNaN(date.getTime())) {
          formattedUpdatedAt = date.toLocaleString('zh-CN');
        }
      }

      return {
        '项目ID': project.id,
        '项目名称': project.name,
        '项目描述': project.description || '',
        '项目状态': project.status === 'active' ? '活跃' : 
                    project.status === 'completed' ? '已完成' : '已归档',
        '创建时间': formattedCreatedAt,
        '更新时间': formattedUpdatedAt,
      };
    });

    // 返回列宽配置
    const columnWidths = [
      { wch: 8 },  // 项目ID
      { wch: 20 }, // 项目名称
      { wch: 30 }, // 项目描述
      { wch: 10 }, // 项目状态
      { wch: 20 }, // 创建时间
      { wch: 20 }, // 更新时间
    ];

    res.json({
      data: exportData,
      total: rows.length,
      columnWidths
    });
  });
});

export default router; 