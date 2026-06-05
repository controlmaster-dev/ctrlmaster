import { NextRequest } from "next/server";
import { apiHandler, apiCreated } from "@/lib/api/handler";
import { checkRateLimit } from "@/lib/api/rateLimitResponse";
import { publicRegisterSchema } from "@/lib/validation";
import { registerUser } from "@/server/services/authService";

const handleRegister = apiHandler(
  { bodySchema: publicRegisterSchema },
  async ({ body }) => apiCreated(await registerUser(body))
);

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(
    req,
    "AUTH",
    "Demasiados intentos de registro. Espera unos minutos."
  );
  if (limited) return limited;

  return handleRegister(req, { params: Promise.resolve({}) });
}
