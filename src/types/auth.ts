/**
 * Authentication and authorization types
 */

/**
 * User interface
 */
export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  avatar?: string;
  image?: string;
  birthday?: string;
  lastLogin?: Date;
  lastLoginIP?: string;
  lastLoginCountry?: string;
  createdAt?: Date;
  updatedAt?: Date;
  _count?: {
    reports: number;
  };
}

/**
 * User role enum for authorization
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  ENGINEER = 'ENGINEER',
  OPERATOR = 'OPERATOR',
  BOSS = 'BOSS',
}

/**
 * Authentication state interface
 */
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  name: string;
  email: string;
  username: string;
  password: string;
  role?: UserRole;
}

/**
 * Registration code validation request
 */
export interface ValidateRegistrationCodeRequest {
  code: string;
}

/**
 * Registration code response
 */
export interface RegistrationCodeResponse {
  isValid: boolean;
  role?: UserRole;
  email?: string;
}

/**
 * User session data (returned from login)
 */
export interface UserSession {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  avatar?: string;
}
