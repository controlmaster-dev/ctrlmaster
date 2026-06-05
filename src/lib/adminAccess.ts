const DEFAULT_ADMIN_EMAILS = ['knunez@enlace.org', 'rjimenez@enlace.org'];
const DEFAULT_ADMIN_USERNAMES = ['knunez', 'rjimenez'];

function configuredAdminEmails(): string[] {
  const raw = process.env.CONFIG_ADMIN_EMAILS?.trim();
  if (!raw) return DEFAULT_ADMIN_EMAILS;
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function configuredAdminUsernames(): string[] {
  const emails = configuredAdminEmails();
  const fromEmails = emails
    .map((email) => email.split('@')[0])
    .filter(Boolean);
  return [...new Set([...DEFAULT_ADMIN_USERNAMES, ...fromEmails])];
}

export function isConfigAdmin(user: {
  email?: string;
  username?: string;
} | null): boolean {
  if (!user) return false;

  const email = (user.email || '').trim().toLowerCase();
  const username = (user.username || '').trim().toLowerCase();

  return (
    configuredAdminEmails().includes(email) ||
    configuredAdminUsernames().includes(username)
  );
}
