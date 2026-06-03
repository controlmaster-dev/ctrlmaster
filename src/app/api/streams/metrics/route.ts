import { z } from "zod";
import sql from "@/lib/db";
import { apiHandler } from "@/lib/api/handler";

const metricSchema = z.object({
  channel: z.string().min(1),
  type: z.string().min(1),
  value: z.union([z.string(), z.number()]).nullable().optional(),
});

export const POST = apiHandler(
  { auth: true, bodySchema: metricSchema },
  async ({ body }) => {
    const [metric] = await sql`
      INSERT INTO "StreamMetric" ("channel", "type", "value")
      VALUES (${body.channel}, ${body.type}, ${body.value ?? null})
      RETURNING *
    `;
    return metric;
  }
);
