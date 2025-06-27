export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
} 