/**
 * API request and response types
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: string;
  details?: unknown;
  statusCode?: number;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Search options
 */
export interface SearchOptions {
  query: string;
  fields?: string[];
  limit?: number;
}

/**
 * Sort options
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter options
 */
export interface FilterOptions {
  [key: string]: unknown;
}

/**
 * Upload file response
 */
export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Email send response
 */
export interface EmailSendResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * PDF generation response
 */
export interface PdfGenerationResponse {
  success: boolean;
  url?: string;
  message?: string;
  error?: string;
}

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

/**
 * Rate limit info
 */
export interface RateLimitInfo {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}
