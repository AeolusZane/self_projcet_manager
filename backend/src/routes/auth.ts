import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/init';

const router = express.Router();

// JWT密钥（在生产环境中应该使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 存储已撤销的token（在生产环境中应该使用Redis等）
const revokedTokens = new Set<string>();

// 注册接口 - 使用Promise方式
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // 验证输入
  if (!username || !email || !password) {
    return res.status(400).json({ error: '用户名、邮箱和密码都是必需的' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度至少6位' });
  }

  try {
    const db = getDatabase();
    
    // 使用Promise包装数据库操作
    const checkUserExists = (field: string, value: string): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        db.get(`SELECT id FROM users WHERE ${field} = ?`, [value], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(!!row);
          }
        });
      });
    };

    // 检查用户名和邮箱是否已存在
    const [usernameExists, emailExists] = await Promise.all([
      checkUserExists('username', username),
      checkUserExists('email', email)
    ]);

    if (usernameExists) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    if (emailExists) {
      return res.status(400).json({ error: '邮箱已被注册' });
    }

    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const createUser = (): Promise<number> => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
          [username, email, passwordHash],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.lastID);
            }
          }
        );
      });
    };

    const userId = await createUser();

    if (!userId) {
      return res.status(500).json({ error: '注册失败：无法获取用户ID' });
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId, username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '注册成功',
      token,
      user: {
        id: userId,
        username,
        email
      }
    });

  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录接口
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 验证输入
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码都是必需的' });
  }

  const db = getDatabase();
  
  // 查找用户
  db.get(
    'SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?',
    [username, username],
    async (err, user:any) => {
      if (err) {
        console.error('查询用户失败:', err);
        return res.status(500).json({ error: '登录失败' });
      }

      if (!user) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      // 生成JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: '登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    }
  );
});

// 退出登录接口
router.post('/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    // 将token添加到撤销列表
    revokedTokens.add(token);
    
    // 记录退出登录日志
    console.log(`用户退出登录: ${new Date().toISOString()}`);
  }

  res.json({
    message: '退出登录成功'
  });
});

// 验证token中间件
export const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  // 检查token是否已被撤销
  if (revokedTokens.has(token)) {
    return res.status(403).json({ error: '访问令牌已撤销' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: '访问令牌无效' });
    }
    req.user = user;
    next();
  });
};

export default router; 