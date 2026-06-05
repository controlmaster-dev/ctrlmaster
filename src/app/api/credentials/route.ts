import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import {
  getCredentials,
  createCredential,
  removeCredential,
  patchCredential,
} from "@/server/services/credentialService";

export const dynamic = "force-dynamic";

const CREDENTIAL_ROLES = ["ENGINEER", "ADMIN", "BOSS"];

const credentialBodySchema = z.object({
  service: z.string().min(1),
  category: z.string().optional(),
  username: z.string().min(1),
  password: z.string().min(1),
  notes: z.string().nullable().optional(),
});

const credentialUpdateBodySchema = z.object({
  service: z.string().optional(),
  category: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  notes: z.string().nullable().optional(),
});

const credentialIdQuerySchema = z.object({
  id: z.string().min(1, "ID required"),
});

export const GET = apiHandler(
  { auth: true, roles: CREDENTIAL_ROLES },
  async () => getCredentials()
);

export const POST = apiHandler(
  { auth: true, roles: CREDENTIAL_ROLES, bodySchema: credentialBodySchema },
  async ({ body }) => createCredential(body)
);

export const DELETE = apiHandler(
  { auth: true, roles: CREDENTIAL_ROLES, querySchema: credentialIdQuerySchema },
  async ({ query }) => removeCredential(query.id)
);

export const PUT = apiHandler(
  {
    auth: true,
    roles: CREDENTIAL_ROLES,
    querySchema: credentialIdQuerySchema,
    bodySchema: credentialUpdateBodySchema,
  },
  async ({ query, body }) => patchCredential(query.id, body)
);
