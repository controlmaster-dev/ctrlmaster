import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import { UploadedFileModel } from "@/models";
import { apiHandler } from "@/lib/api/handler";
import { decryptBuffer } from "@/lib/encryption";
import { NotFoundError } from "@/lib/errors";

export const dynamic = "force-dynamic";

function contentDisposition(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `inline; filename="${fallback}"`;
}

export const GET = apiHandler({ auth: true }, async ({ route }) => {
  const rawId = route.params?.id;
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : undefined;
  if (!id) throw new NotFoundError("Archivo no encontrado");

  await connectMongo();
  const file = await UploadedFileModel.findById(id).lean();
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
