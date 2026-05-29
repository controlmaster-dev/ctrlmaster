import { ApiError, ValidationError } from '@/lib/errors';
import {
  createTasks,
  deleteTask,
  listTasks,
  updateTask,
  type CreateTasksInput,
  type UpdateTaskInput,
} from '@/server/repositories/taskRepository';

export async function getTasksForUser(userId: string, date?: string) {
  return listTasks(userId, date);
}

export async function createTasksForUser(input: CreateTasksInput) {
  return createTasks(input);
}

export async function updateTaskById(input: UpdateTaskInput) {
  const updated = await updateTask(input);
  if (!updated) {
    throw new ApiError('No fields to update', 400);
  }
  return updated;
}

export async function deleteTaskById(id?: string | null) {
  if (!id) {
    throw new ValidationError('ID de tarea invalido');
  }

  await deleteTask(id);
  return { success: true };
}
