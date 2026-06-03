/** Columnas de Report (evitar SELECT * tras migraciones — error "cached plan must not change result type"). */
export const REPORT_COLUMNS = [
  "id",
  "code",
  "operatorId",
  "operatorName",
  "operatorEmail",
  "problemDescription",
  "category",
  "priority",
  "status",
  "dateStarted",
  "dateResolved",
  "emailStatus",
  "emailRecipients",
  "createdAt",
  "updatedAt",
] as const;
