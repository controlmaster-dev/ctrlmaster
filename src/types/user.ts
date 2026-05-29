


import { UserRole } from './auth';


export interface UserShift {
  days: number[];
  start: number;
  end: number;
}


export interface Schedule {
  shifts: UserShift[];
  label: string;
}


export interface UserHeartbeat {
  userId: string;
  timestamp: Date;
  isActive: boolean;
  currentActivity?: string;
}


export interface UserListOptions {
  role?: UserRole;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}


export interface UserUpdateRequest {
  id: string;
  name?: string;
  email?: string;
  username?: string;
  role?: UserRole;
  avatar?: string;
  birthday?: string;
}
