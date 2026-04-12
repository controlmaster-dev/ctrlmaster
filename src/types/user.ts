/**
 * User and operator types
 */

import { UserRole } from './auth';

/**
 * User shift interface
 */
export interface UserShift {
  days: number[];
  start: number;
  end: number;
}

/**
 * User schedule interface
 */
export interface Schedule {
  shifts: UserShift[];
  label: string;
}

/**
 * User heartbeat data
 */
export interface UserHeartbeat {
  userId: string;
  timestamp: Date;
  isActive: boolean;
  currentActivity?: string;
}

/**
 * User list request options
 */
export interface UserListOptions {
  role?: UserRole;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * User update payload
 */
export interface UserUpdateRequest {
  id: string;
  name?: string;
  email?: string;
  username?: string;
  role?: UserRole;
  avatar?: string;
  birthday?: string;
}
