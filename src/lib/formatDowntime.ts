export function formatDowntime(
  dateStarted: string | Date,
  dateResolved: string | Date
): string {
  const start = new Date(dateStarted).getTime();
  const end = new Date(dateResolved).getTime();
  const diffMs = end - start;

  if (Number.isNaN(start) || Number.isNaN(end) || diffMs < 0) return "N/A";
  if (diffMs < 1000) return "Menos de 1 segundo";

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    const parts = [`${hours}h`];
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    return parts.join(" ");
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`;
  }
  return `${seconds} s`;
}
