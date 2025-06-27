export interface Task {
  id?: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  project_id?: number;
  due_date?: string; // 包含日期和时间的完整字符串
  created_at?: string;
  created_at?: string;
  updated_at?: string;
  project_name?: string;
}

export interface Project {
  id?: number;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
} 