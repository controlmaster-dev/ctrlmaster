/**
 * Custom error classes for better error handling
 */

/**
 * Base API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      error: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Validation error class
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends ApiError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends ApiError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * File upload error class
 */
export class FileUploadError extends ApiError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'FileUploadError';
  }
}

/**
 * Email error class
 */
export class EmailError extends ApiError {
  constructor(message: string) {
    super(message, 500);
    this.name = 'EmailError';
  }
}

/**
 * Database error class
 */
export class DatabaseError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * External service error class
 */
export class ExternalServiceError extends ApiError {
  constructor(service: string, message = 'External service error') {
    super(`${service}: ${message}`, 502);
    this.name = 'ExternalServiceError';
  }
}

/**
 * Check if error is an instance of ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Get error status code from unknown error
 */
export function getErrorStatusCode(error: unknown): number {
  if (isApiError(error)) {
    return error.statusCode;
  }
  return 500;
}
