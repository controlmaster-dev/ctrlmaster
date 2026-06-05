/** Perfiles visibles en /diarios (columnas del tablero). */

export const DIARIOS_PROFILE_ROLES = ["OPERATOR", "ADMIN", "BOSS"] as const;

export type DiariosProfileRole = (typeof DIARIOS_PROFILE_ROLES)[number];

/** Cuentas de correo / usuario que no aparecen en el tablero. */
export const DIARIOS_EXCLUDED_EMAILS = [
  "rjimenez@enlace.org",
  "ingenieria@enlace.org",
] as const;

export const DIARIOS_EXCLUDED_USERNAMES = ["rjimenez", "ingenieria"] as const;

export function diariosRoleLabel(role?: string | null): string {
  if (role === "ADMIN") return "Administrador";
  if (role === "BOSS") return "Jefe";
  if (role === "OPERATOR") return "Operador";
  if (role === "ENGINEER") return "Ingeniero";
  return role ?? "";
}

export function isDiariosExcludedProfile(profile: {
  email?: string | null;
  username?: string | null;
}): boolean {
  const email = (profile.email ?? "").trim().toLowerCase();
  const username = (profile.username ?? "").trim().toLowerCase();
  return (
    (DIARIOS_EXCLUDED_EMAILS as readonly string[]).includes(email) ||
    (DIARIOS_EXCLUDED_USERNAMES as readonly string[]).includes(username)
  );
}
