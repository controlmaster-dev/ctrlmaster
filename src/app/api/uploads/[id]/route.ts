import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { apiHandler } from "@/lib/api/handler";
import { decryptBuffer } from "@/lib/encryption";
import { NotFoundError } from "@/lib/errors";

export const dynamic = "force-dynamic";

type UploadedFileRow = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  ciphertext: Buffer | Uint8Array;
  iv: string;
  authTag: string;
};

function contentDisposition(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `inline; filename="${fallback}"`;
}

export const GET = apiHandler({ auth: true }, async ({ route }) => {
  const rawId = route.params?.id;
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : undefined;
  if (!id) throw new NotFoundError("Archivo no encontrado");

  const [file] = await sql<UploadedFileRow[]>`
    SELECT "id", "filename", "contentType", "size", "ciphertext", "iv", "authTag"
    FROM "UploadedFile"
    WHERE "id" = ${id}
    LIMIT 1
  `;

  if (!file) throw new NotFoundError("Archivo no encontrado");

  const plaintext = decryptBuffer({
    ciphertext: file.ciphertext,
    iv: file.iv,
    authTag: file.authTag,
  });

  return new NextResponse(new Uint8Array(plaintext), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.size),
      "Content-Disposition": contentDisposition(file.filename),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
