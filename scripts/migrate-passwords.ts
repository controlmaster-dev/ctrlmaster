import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

const SCRYPT_PREFIX = "scrypt$";

/** Cuenta ya migrada a scrypt — no tocar. */
const SKIP_IDENTITIES = new Set(["knunez@enlace.org", "knunez"]);

function normalizeId(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

function shouldSkipUser(user: { email?: string; username?: string }): boolean {
  const email = normalizeId(user.email);
  const username = normalizeId(user.username);
  for (const id of SKIP_IDENTITIES) {
    const needle = id.toLowerCase();
    if (email === needle || username === needle) return true;
  }
  return false;
}

function isSha256Hex(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

type PasswordKind = "scrypt" | "sha256" | "plaintext";

function classifyPassword(password: string): PasswordKind {
  if (!password || password.startsWith(SCRYPT_PREFIX)) return "scrypt";
  if (isSha256Hex(password)) return "sha256";
  return "plaintext";
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const { connectMongo } = await import("../src/lib/mongo");
  const { UserModel } = await import("../src/models");
  const { hashPassword } = await import("../src/lib/crypto");

  await connectMongo();

  const users = await UserModel.find()
    .select("name email username password")
    .lean();

  const plan: Array<{
    id: string;
    email: string;
    username: string;
    kind: PasswordKind;
    action: "skip" | "migrate" | "warn-sha256";
  }> = [];

  for (const user of users) {
    const id = String(user._id);
    const email = user.email ?? "";
    const username = user.username ?? "";
    const kind = classifyPassword(user.password);

    if (shouldSkipUser(user)) {
      plan.push({ id, email, username, kind, action: "skip" });
      continue;
    }

    if (kind === "scrypt") {
      plan.push({ id, email, username, kind, action: "skip" });
      continue;
    }

    if (kind === "sha256") {
      plan.push({ id, email, username, kind, action: "warn-sha256" });
      continue;
    }

    plan.push({ id, email, username, kind, action: "migrate" });
  }

  const toMigrate = plan.filter((p) => p.action === "migrate");
  const sha256Only = plan.filter((p) => p.action === "warn-sha256");
  const skipped = plan.filter((p) => p.action === "skip");

  console.log(`Usuarios en BD: ${users.length}`);
  console.log(`A hashear (plaintext → scrypt): ${toMigrate.length}`);
  console.log(`Ya en scrypt / excluidos: ${skipped.length}`);
  console.log(`SHA256 legacy (sin migrar automática): ${sha256Only.length}`);

  if (toMigrate.length > 0) {
    console.log("\nVista previa (usuarios a migrar):");
    for (const item of toMigrate) {
      console.log(`  ${item.email || item.username} (${item.kind})`);
    }
  }

  if (sha256Only.length > 0) {
    console.log(
      "\nSHA256 legacy: el login sigue funcionando; se re-hashea al iniciar sesión con la contraseña correcta."
    );
    for (const item of sha256Only) {
      console.log(`  ${item.email || item.username}`);
    }
  }

  if (toMigrate.length === 0) {
    console.log("\nNada que actualizar.");
    process.exit(0);
  }

  if (dryRun) {
    console.log("\n[dry-run] No se escribió nada en la base de datos.");
    process.exit(0);
  }

  for (const item of toMigrate) {
    const doc = await UserModel.findById(item.id).select("password").lean();
    if (!doc?.password || classifyPassword(doc.password) !== "plaintext") continue;

    const upgraded = await hashPassword(doc.password);
    await UserModel.findByIdAndUpdate(item.id, { password: upgraded });
    console.log(`  ✓ ${item.email || item.username}`);
  }

  console.log(`\nMigración completada: ${toMigrate.length} contraseñas hasheadas con scrypt.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en migración de contraseñas:", err);
  process.exit(1);
});
