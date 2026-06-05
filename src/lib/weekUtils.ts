
export function getSundayWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const sunday = new Date(d.setDate(diff));
  const year = sunday.getFullYear();
  const month = String(sunday.getMonth() + 1).padStart(2, "0");
  const dayStr = String(sunday.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayStr}`;
}
