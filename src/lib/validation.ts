/**
 * Input validation schemas using Zod
 */

import { z } from 'zod';

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email o nombre de usuario es requerido'),
  password: z.string().min(1, 'Contraseña es requerida'),
});

/**
 * Register validation schema
 */
export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['ADMIN', 'ENGINEER', 'OPERATOR']).optional(),
});

/**
 * Registration code validation schema
 */
export const validateRegistrationCodeSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
});

/**
 * Create report validation schema
 */
export const createReportSchema = z.object({
  operatorId: z.string().min(1, 'ID de operador es requerido'),
  operatorName: z.string().min(1, 'Nombre de operador es requerido'),
  operatorEmail: z.string().email('Email inválido').or(z.literal('')).optional(),
  problemDescription: z.string().min(1, 'La descripción es requerida'),
  category: z.string().min(1, 'Categoría es requerida'),
  priority: z.string().min(1, 'Prioridad es requerida'),
  status: z.enum(['pending', 'in-progress', 'resolved']),
  dateStarted: z.string().or(z.date()),
  dateResolved: z.string().or(z.date()).nullable().optional(),
  emailStatus: z.enum(['none', 'pending', 'sent', 'failed']).optional(),
  emailRecipients: z.string().nullable().optional(),
  attachments: z.array(
    z.object({
      url: z.string(),
      type: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']),
      data: z.string().optional(),
    })
  ).optional(),
});

/**
 * Update report validation schema
 */
export const updateReportSchema = z.object({
  id: z.string().min(1, 'ID de reporte es requerido'),
  status: z.enum(['pending', 'in-progress', 'resolved']).optional(),
  dateResolved: z.date().nullable().optional(),
});

/**
 * Delete report validation schema
 */
export const deleteReportSchema = z.object({
  id: z.string().min(1, 'ID de reporte es requerido'),
});

/**
 * User update validation schema
 */
export const updateUserSchema = z.object({
  id: z.string().min(1, 'ID de usuario es requerido'),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  role: z.enum(['ADMIN', 'ENGINEER', 'OPERATOR']).optional(),
  avatar: z.string().optional(),
  birthday: z.string().optional(),
});

/**
 * Comment validation schema
 */
export const createCommentSchema = z.object({
  reportId: z.string().min(1, 'ID de reporte es requerido'),
  userId: z.string().min(1, 'ID de usuario es requerido'),
  userName: z.string().min(1, 'Nombre de usuario es requerido'),
  content: z.string().min(1, 'El contenido es requerido'),
});

/**
 * Reaction validation schema
 */
export const createReactionSchema = z.object({
  reportId: z.string().min(1, 'ID de reporte es requerido'),
  userId: z.string().min(1, 'ID de usuario es requerido'),
  emoji: z.string().min(1, 'El emoji es requerido'),
});

/**
 * Task validation schema
 */
export const createTaskSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().or(z.date()).optional(),
  status: z.enum(['pending', 'in-progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

/**
 * Special event validation schema
 */
export const createSpecialEventSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.string().optional(),
  affectedUsers: z.array(z.string()).optional(),
});

/**
 * Schedule configuration validation schema
 */
export const updateScheduleConfigSchema = z.object({
  userId: z.string().min(1, 'ID de usuario es requerido'),
  shifts: z.array(
    z.object({
      days: z.array(z.number().min(0).max(6)),
      start: z.number().min(0).max(23),
      end: z.number().min(0).max(24),
    })
  ),
  label: z.string().min(1, 'La etiqueta es requerida'),
});

/**
 * Upload file validation schema
 */
export const uploadFileSchema = z.object({
  file: z.any().refine(
    (file) => file instanceof File,
    'El archivo es requerido'
  ).refine(
    (file) => file.size <= 4 * 1024 * 1024,
    'El archivo no puede exceder 4MB'
  ).refine(
    (file) => ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'].includes(file.type),
    'Tipo de archivo no soportado'
  ),
});

/**
 * Pagination validation schema
 */
export const paginationSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
  offset: z.number().optional(),
});

/**
 * Search validation schema
 */
export const searchSchema = z.object({
  query: z.string().min(1, 'La consulta es requerida'),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

/**
 * Calendar event validation schema
 */
export const calendarEventSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  start: z.string().or(z.date()),
  end: z.string().or(z.date()),
  type: z.enum(['shift', 'special-event', 'reminder']),
  userId: z.string().optional(),
  userName: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Type inference helpers
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateReactionInput = z.infer<typeof createReactionSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateSpecialEventInput = z.infer<typeof createSpecialEventSchema>;
export type UpdateScheduleConfigInput = z.infer<typeof updateScheduleConfigSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
