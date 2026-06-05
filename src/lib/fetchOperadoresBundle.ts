import { getDashboardCache } from "@/lib/dashboardCache";
import type { OperadoresBundle } from "@/lib/operadoresCache";
import type { Operator } from "@/lib/types";
import { sortOperatorsByShiftQueue } from "@/lib/operadorSchedule";

function sortOperators(data: unknown[]): Operator[] {
  return sortOperatorsByShiftQueue(data as Operator[]);
}

export async function fetchOperadoresBundle(
  weekStart: string
): Promise<OperadoresBundle | null> {
  try {
    const res = await fetch(
      `/api/operadores/bootstrap?weekStart=${encodeURIComponent(weekStart)}`,
      { credentials: "include", cache: "no-store" }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      operators?: unknown[];
      allUsers?: unknown[];
      specialEvents?: unknown[];
    };

    const dash = getDashboardCache();
    const allUsersRaw =
      Array.isArray(data.allUsers) && data.allUsers.length > 0
        ? data.allUsers
        : dash?.users?.length
          ? dash.users
          : [];

    const operators = sortOperators(
      Array.isArray(data.operators) ? data.operators : []
    );
    const allUsers = sortOperators(allUsersRaw);

    return {
      weekStart,
      operators,
      allUsers,
      specialEvents: Array.isArray(data.specialEvents) ? data.specialEvents : [],
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}
