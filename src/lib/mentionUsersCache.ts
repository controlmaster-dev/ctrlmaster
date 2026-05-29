


interface MentionUser {
  id: string;
  name: string;
  image?: string | null;
}

const TTL = 5 * 60 * 1000;

let cache: { data: MentionUser[]; fetchedAt: number } | null = null;
let inflight: Promise<MentionUser[]> | null = null;

export function getCachedMentionUsers(): MentionUser[] | null {
  if (cache && Date.now() - cache.fetchedAt < TTL) return cache.data;
  return null;
}

export async function fetchMentionUsers(): Promise<MentionUser[]> {
  const cached = getCachedMentionUsers();
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/api/users/mentions");
      if (!res.ok) return cache?.data ?? [];
      const data = (await res.json()) as MentionUser[];
      cache = { data: Array.isArray(data) ? data : [], fetchedAt: Date.now() };
      return cache.data;
    } catch {
      return cache?.data ?? [];
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
