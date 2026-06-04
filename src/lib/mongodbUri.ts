export function mongoUriFromEnv(): string | undefined {
  return process.env.MONGODB_URI?.trim() || process.env.MONGO_URI?.trim() || undefined;
}

export function resolveMongoUri(raw?: string): string {
  if (!raw?.trim()) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  let url = raw.trim();
  if (url.startsWith("MONGODB_URI=")) {
    url = url.slice("MONGODB_URI=".length).trim();
  }

  if (!url.startsWith("mongodb://") && !url.startsWith("mongodb+srv://")) {
    throw new Error(
      'MONGODB_URI must be a MongoDB connection string (mongodb:// or mongodb+srv://)'
    );
  }

  return url;
}
