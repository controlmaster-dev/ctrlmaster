const ALLOWED_EMAILS = ["knunez@enlace.org", "rjimenez@enlace.org"];
const ALLOWED_USERNAMES = ["knunez", "rjimenez"];

export function isConfigAdmin(user: {
  email?: string;
  username?: string;
} | null): boolean {
  if (!user) return false;
  const email = user.email || "";
  const username = user.username || "";
  return (
    ALLOWED_EMAILS.includes(email) || ALLOWED_USERNAMES.includes(username)
  );
}
