-- Calendar ICS feed: opaque token required in ?token= (auto-applied on first use if column missing)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "calendarFeedToken" TEXT;
