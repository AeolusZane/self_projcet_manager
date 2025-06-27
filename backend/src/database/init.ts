import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'tasks.db');

let db: sqlite3.Database;

export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 确保数据目录存在
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err);
        reject(err);
        return;
      }
      
      console.log('数据库连接成功');
      createTables()
        .then(() => {
          console.log('数据库初始化完成');
          resolve();
        })
        .catch(reject);
    });
  });
};

const createTables = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 用户表
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `;
    
    // 项目表
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        user_id INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;
    
    // 任务表
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        project_id INTEGER,
        user_id INTEGER NOT NULL,
        due_date TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        completed_at TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;
    
    db.serialize(() => {
      // 创建用户表
      db.run(createUsersTable, (err) => {
        if (err) {
          console.error('创建用户表失败:', err);
          reject(err);
          return;
        }
        console.log('用户表创建成功');
      });
      
      // 创建项目表
      db.run(createProjectsTable, (err) => {
        if (err) {
          console.error('创建项目表失败:', err);
          reject(err);
          return;
        }
        console.log('项目表创建成功');
      });
      
      // 创建任务表
      db.run(createTasksTable, (err) => {
        if (err) {
          console.error('创建任务表失败:', err);
          reject(err);
          return;
        }
        console.log('任务表创建成功');
      });

      // 为现有表添加缺失的字段（如果表已存在）
      db.run(`
        ALTER TABLE projects ADD COLUMN user_id INTEGER
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('添加项目用户ID字段失败:', err);
        } else {
          console.log('项目用户ID字段检查完成');
        }
      });

      db.run(`
        ALTER TABLE tasks ADD COLUMN user_id INTEGER
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('添加任务用户ID字段失败:', err);
        } else {
          console.log('任务用户ID字段检查完成');
        }
      });

      db.run(`
        ALTER TABLE tasks ADD COLUMN completed_at TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('添加完成时间字段失败:', err);
        } else {
          console.log('完成时间字段检查完成');
        }
      });
      
      resolve();
    });
  });
};

export const getDatabase = (): sqlite3.Database => {
  if (!db) {
    throw new Error('数据库未初始化');
  }
  return db;
};