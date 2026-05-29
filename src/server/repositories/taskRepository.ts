import sql from '@/lib/db';

export type TaskInput = {
  title: string;
  deadline?: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
};

export type CreateTasksInput = {
  userId: string;
  tasks: TaskInput[];
  dates: string[];
};

export type UpdateTaskInput = {
  id: string;
  status?: 'PENDING' | 'COMPLETED' | 'INCOMPLETE';
  comment?: string;
};

export async function listTasks(userId: string, date?: string) {
  return sql`
    SELECT * FROM "Task"
    WHERE "userId" = ${userId}
    ${date ? sql`AND "scheduledDate" = ${date}` : sql``}
    ORDER BY "createdAt" DESC
  `;
}

export async function createTasks({ userId, tasks, dates }: CreateTasksInput) {
  return sql.begin(async (tx) => {
    const created = [];

    for (const dateStr of dates) {
      for (const task of tasks) {
        const [row] = await tx`
          INSERT INTO "Task" ("title", "deadline", "priority", "userId", "scheduledDate", "status")
          VALUES (${task.title}, ${task.deadline || null}, ${task.priority}, ${userId}, ${dateStr}, 'PENDING')
          RETURNING *
        `;
        created.push(row);
      }
    }

    return created;
  });
}

export async function updateTask({ id, status, comment }: UpdateTaskInput) {
  const data: Record<string, string | null> = {};

  if (comment !== undefined) data.comment = comment;
  if (status !== undefined) {
    data.status = status;
    if (['COMPLETED', 'INCOMPLETE'].includes(status)) {
      data.completedAt = new Date().toISOString();
    } else if (status === 'PENDING') {
      data.completedAt = null;
    }
  }

  if (Object.keys(data).length === 0) return null;

  const [updated] = await sql`
    UPDATE "Task"
    SET ${sql(data)}
    WHERE "id" = ${id}
    RETURNING *
  `;

  return updated ?? null;
}

export async function deleteTask(id: string) {
  await sql`DELETE FROM "Task" WHERE "id" = ${id}`;
}
