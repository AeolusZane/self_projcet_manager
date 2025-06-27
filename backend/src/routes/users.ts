import express from 'express';
import bcrypt from 'bcrypt';
import { getDatabase } from '../database/init';
import { DateUtils } from '../utils/dateUtils';

const router = express.Router();

// 获取所有用户
router.get('/', (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT 
      id, 
      username, 
      email, 
      created_at, 
      updated_at
    FROM users 
    ORDER BY created_at DESC
  `;
  
  db.all(query, [], (err, users) => {
    if (err) {
      console.error('获取用户列表失败:', err);
      return res.status(500).json({ error: '获取用户列表失败' });
    }
    
    // 直接返回用户数组，与前端期望的格式一致
    res.json(users);
  });
});

// 根据ID获取用户详情
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  const query = `
    SELECT 
      id, 
      username, 
      email, 
      created_at, 
      updated_at
    FROM users 
    WHERE id = ?
  `;
  
  db.get(query, [id], (err, user) => {
    if (err) {
      console.error('获取用户详情失败:', err);
      return res.status(500).json({ error: '获取用户详情失败' });
    }
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 直接返回用户对象，与前端期望的格式一致
    res.json(user);
  });
});

// 创建新用户
router.post('/', async (req, res) => {
  const { username, email, password } = req.body;
  
  // 验证输入
  if (!username || !email || !password) {
    return res.status(400).json({ error: '用户名、邮箱和密码都是必需的' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度至少6位' });
  }
  
  const db = getDatabase();
  
  try {
    // 检查用户名和邮箱是否已存在
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email],
        (err, user) => {
          if (err) reject(err);
          else resolve(user);
        }
      );
    });
    
    if (existingUser) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }
    
    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // 获取当前本地时间
    const currentTime = DateUtils.getCurrentLocalString();
    
    // 创建用户
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [username, email, passwordHash, currentTime, currentTime],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
    
    // 返回创建的用户信息
    res.status(201).json({
      id: (result as any).id,
      username,
      email,
      created_at: currentTime,
      updated_at: currentTime
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({ error: '创建用户失败' });
  }
});

// 更新用户信息
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;
  
  if (!username || !email) {
    return res.status(400).json({ error: '用户名和邮箱都是必需的' });
  }
  
  const db = getDatabase();
  
  // 检查用户名和邮箱是否已被其他用户使用
  db.get(
    'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
    [username, email, id],
    async (err, existingUser) => {
      if (err) {
        console.error('检查用户是否存在失败:', err);
        return res.status(500).json({ error: '更新用户失败' });
      }
      
      if (existingUser) {
        return res.status(400).json({ error: '用户名或邮箱已被其他用户使用' });
      }
      
      try {
        let updateQuery = 'UPDATE users SET username = ?, email = ?, updated_at = ?';
        let params = [username, email, DateUtils.getCurrentLocalString()];
        
        // 如果提供了新密码，则更新密码
        if (password) {
          const saltRounds = 10;
          const passwordHash = await bcrypt.hash(password, saltRounds);
          updateQuery += ', password_hash = ?';
          params.push(passwordHash);
        }
        
        updateQuery += ' WHERE id = ?';
        params.push(id);
        
        db.run(updateQuery, params, function(err) {
          if (err) {
            console.error('更新用户失败:', err);
            return res.status(500).json({ error: '更新用户失败' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: '用户不存在' });
          }
          
          // 返回更新后的用户信息
          res.json({
            id: parseInt(id),
            username,
            email,
            updated_at: DateUtils.getCurrentLocalString()
          });
        });
      } catch (error) {
        console.error('更新用户失败:', error);
        res.status(500).json({ error: '更新用户失败' });
      }
    }
  );
});

// 重置用户密码
router.post('/:id/reset-password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: '新密码是必需的' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度至少6位' });
  }
  
  const db = getDatabase();
  
  try {
    // 检查用户是否存在
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE id = ?', [id], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 加密新密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // 更新密码
    const result = await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
        [passwordHash, DateUtils.getCurrentLocalString(), id],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
    
    if ((result as any).changes === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ message: '密码重置成功' });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({ error: '重置密码失败' });
  }
});

// 删除用户
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('删除用户失败:', err);
      return res.status(500).json({ error: '删除用户失败' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ message: '用户删除成功' });
  });
});

export default router; 