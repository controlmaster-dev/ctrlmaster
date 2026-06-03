export function toDatetimeLocalValue(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 19);
}

export function parseDatetimeLocal(value: string): Date {
  return new Date(value);
}
