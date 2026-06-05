import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { getSpecialEvents } from "@/server/services/specialEventService";
import { listUsers } from "@/server/repositories/userRepository";

export const dynamic = "force-dynamic";

export const GET = apiHandler({ auth: true }, async () => {
  const [events, usersRaw] = await Promise.all([getSpecialEvents(), listUsers()]);

  const users = usersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image ?? undefined,
    role: u.role,
  }));

  return NextResponse.json(
    { events, users },
    { headers: { "Cache-Control": "private, max-age=60" } }
  );
});
