


export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}


export interface ApiErrorResponse {
  error: string;
  details?: unknown;
  statusCode?: number;
}


export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}


export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


export interface SearchOptions {
  query: string;
  fields?: string[];
  limit?: number;
}


export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}


export interface FilterOptions {
  [key: string]: unknown;
}


export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}


export interface EmailSendResponse {
  success: boolean;
  message?: string;
  error?: string;
}


export interface PdfGenerationResponse {
  success: boolean;
  url?: string;
  message?: string;
  error?: string;
}


export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}


export interface RateLimitInfo {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}
