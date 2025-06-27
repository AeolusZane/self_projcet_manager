import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';

const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'tasks.db');

export function getDatabase(): sqlite3.Database {
  return new sqlite3.Database(dbPath);
}

export async function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 确保数据目录存在
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const db = getDatabase();
    
    // 创建用户表
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // 创建项目表
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;
    
    // 创建任务表 - 添加用户ID字段
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        project_id INTEGER,
        user_id INTEGER,
        due_date DATETIME,
        created_date DATE DEFAULT CURRENT_DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

      // 为现有表添加用户ID字段（如果表已存在）
      db.run(`
        ALTER TABLE projects ADD COLUMN user_id INTEGER
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('添加项目用户ID字段失败:', err);
        } else {
          console.log('项目用户ID字段添加成功或已存在');
        }
      });

      db.run(`
        ALTER TABLE tasks ADD COLUMN user_id INTEGER
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('添加任务用户ID字段失败:', err);
        } else {
          console.log('任务用户ID字段添加成功或已存在');
        }
      });

      // 为现有任务添加创建日期（如果表已存在）
      db.run(`
        ALTER TABLE tasks ADD COLUMN created_date DATE DEFAULT CURRENT_DATE
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('添加创建日期字段失败:', err);
        } else {
          console.log('创建日期字段添加成功或已存在');
        }
      });
      
      resolve();
    });
    
    db.close();
  });
} 