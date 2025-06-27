export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
} 