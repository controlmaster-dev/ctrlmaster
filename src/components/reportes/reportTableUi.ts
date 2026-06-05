export function splitCategoryLabels(category: string): string[] {
  return category
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}
