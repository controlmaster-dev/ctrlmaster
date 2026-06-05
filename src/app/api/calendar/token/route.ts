import { apiHandler } from '@/lib/api/handler';
import { getOrCreateCalendarFeedToken } from '@/lib/calendarFeed';
import { NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export const GET = apiHandler({ auth: true }, async ({ user }) => {
  const userId = String(user?.id ?? '');
  const token = await getOrCreateCalendarFeedToken(userId);

  if (!token) {
    throw new NotFoundError('Usuario no encontrado');
  }

  return { token };
});
