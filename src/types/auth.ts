


export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  avatar?: string;
  image?: string;
  birthday?: string;
  phone?: string | null;
  lastLogin?: Date;
  lastLoginIP?: string;
  lastLoginCountry?: string;
  createdAt?: Date;
  updatedAt?: Date;
  _count?: {
    reports: number;
  };
}


export enum UserRole {
  ADMIN = 'ADMIN',
  ENGINEER = 'ENGINEER',
  OPERATOR = 'OPERATOR',
  BOSS = 'BOSS',
}


export interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}


export interface LoginRequest {
  email: string;
  password: string;
}


export interface RegisterRequest {
  name: string;
  email: string;
  username: string;
  password: string;
  role?: UserRole;
}


export interface ValidateRegistrationCodeRequest {
  code: string;
}


export interface RegistrationCodeResponse {
  isValid: boolean;
  role?: UserRole;
  email?: string;
}


export interface UserSession {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  avatar?: string;
}
